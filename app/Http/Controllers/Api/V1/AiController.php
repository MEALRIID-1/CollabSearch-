<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Meeting;
use App\Models\Publication;
use App\Models\Project;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\AiMemory;
use App\Models\AiContext;
use App\Enums\AiAnalysisStatus;
use App\Enums\AiAnalysisType;
use App\Jobs\AnalyzeMeetingJob;
use App\Jobs\AnalyzePublicationJob;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AiController extends Controller
{
    public function __construct(
        protected readonly AiService $aiService
    ) {}

    /**
     * Lancer l'analyse d'une réunion.
     */
    public function analyzeMeeting(Request $request, Meeting $meeting): JsonResponse
    {
        $user = $request->user();

        if ($meeting->organizer_id !== $user->id && !$meeting->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Non autorisé à analyser cette réunion.'], 403);
        }

        $force = $request->boolean('force', false);
        if (!$force) {
            $existing = $meeting->analyses()->where('type', AiAnalysisType::MEETING_SUMMARY)->where('status', AiAnalysisStatus::COMPLETED)->first();
            if ($existing) {
                return response()->json(['message' => 'Une analyse existe déjà pour cette réunion.', 'analysis' => $existing]);
            }
        }

        $analysis = AiAnalysis::create([
            'uuid' => (string) Str::uuid(),
            'analysable_type' => Meeting::class,
            'analysable_id' => $meeting->id,
            'requested_by' => $user->id,
            'type' => AiAnalysisType::MEETING_SUMMARY,
            'status' => AiAnalysisStatus::PENDING,
        ]);

        AnalyzeMeetingJob::dispatch($meeting, $analysis);

        return response()->json([
            'message' => 'Analyse de la réunion démarrée en arrière-plan.',
            'analysis' => $analysis,
        ], 202);
    }

    /**
     * Lancer l'analyse d'une publication.
     */
    public function analyzePublication(Request $request, Publication $publication): JsonResponse
    {
        $user = $request->user();

        $force = $request->boolean('force', false);
        if (!$force) {
            $existing = $publication->analyses()->where('type', AiAnalysisType::PUBLICATION_ANALYSIS)->where('status', AiAnalysisStatus::COMPLETED)->first();
            if ($existing) {
                return response()->json(['message' => 'Une analyse existe déjà pour cette publication.', 'analysis' => $existing]);
            }
        }

        $analysis = AiAnalysis::create([
            'uuid' => (string) Str::uuid(),
            'analysable_type' => Publication::class,
            'analysable_id' => $publication->id,
            'requested_by' => $user->id,
            'type' => AiAnalysisType::PUBLICATION_ANALYSIS,
            'status' => AiAnalysisStatus::PENDING,
        ]);

        AnalyzePublicationJob::dispatch($publication, $analysis);

        return response()->json([
            'message' => 'Analyse de la publication démarrée en arrière-plan.',
            'analysis' => $analysis,
        ], 202);
    }

    /**
     * Récupérer le statut et le résultat d'une analyse via son UUID.
     */
    public function getAnalysis(Request $request, string $uuid): JsonResponse
    {
        $analysis = AiAnalysis::where('uuid', $uuid)->firstOrFail();
        return response()->json(['analysis' => $analysis]);
    }

    /**
     * Chatbot assistant — mode stateless (legacy, compatible ancien frontend).
     */
    public function chatAssistant(Request $request): JsonResponse
    {
        $request->validate([
            'question'     => 'required|string|max:2000',
            'project_id'   => 'nullable|integer|exists:projects,id',
            'current_page' => 'nullable|string|max:100',
        ]);

        $question    = $request->input('question');
        $projectId   = $request->input('project_id');
        $currentPage = $request->input('current_page');
        $context     = $this->buildProjectContext($projectId, $currentPage);

        $result = $this->aiService->chatAssistant($question, $context, $request->user()->id);

        return response()->json([
            'response'               => $result['response'],
            'reasoning'              => $result['reasoning'],
            'confidence_score'       => $result['confidence_score'],
            'sources'                => $result['sources'],
            'is_clarification'       => $result['is_clarification'],
            'clarification_question' => $result['clarification_question'],
            'memory_notifications'   => $result['memory_notifications'] ?? [],
        ]);
    }

    /**
     * Liste des conversations de l'utilisateur.
     */
    public function conversations(Request $request): JsonResponse
    {
        $conversations = AiConversation::where('user_id', $request->user()->id)
            ->whereIn('status', ['active', 'archived'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Créer une nouvelle conversation.
     */
    public function createConversation(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'nullable|string|max:200',
            'project_id' => 'nullable|integer|exists:projects,id',
        ]);

        $conversation = AiConversation::create([
            'user_id' => $request->user()->id,
            'project_id' => $request->input('project_id'),
            'title' => $request->input('title', 'Nouvelle discussion'),
            'status' => 'active',
        ]);

        return response()->json(['conversation' => $conversation], 201);
    }

    /**
     * Historique des messages d'une conversation.
     */
    public function getMessages(Request $request, $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);
        $messages = $conversation->messages()->get();

        return response()->json(['messages' => $messages]);
    }

    /**
     * Envoyer un message dans une conversation — PIPELINE 10 ÉTAPES.
     */
    public function chat(Request $request, $id): JsonResponse
    {
        $request->validate([
            'question'           => 'required|string|max:2000',
            'project_id'         => 'nullable|integer|exists:projects,id',
            'web_search_enabled' => 'nullable|boolean',
            'current_page'       => 'nullable|string|max:100',
        ]);

        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);

        $question         = $request->input('question');
        $projectId        = $request->input('project_id') ?? $conversation->project_id;
        $webSearchEnabled = $request->boolean('web_search_enabled', true);
        $currentPage      = $request->input('current_page');

        // Sauvegarder le message utilisateur
        AiMessage::create([
            'ai_conversation_id' => $conversation->id,
            'role'               => 'user',
            'content'            => $question,
        ]);

        // Construire le contexte projet
        $context = $this->buildProjectContext($projectId, $currentPage);

        // Appel au moteur IA avec le pipeline 10 étapes
        $result = $this->aiService->chatAssistant(
            $question,
            $context,
            $request->user()->id,
            $webSearchEnabled,
            $conversation->id
        );

        // Sauvegarder le message assistant enrichi
        $assistantMessage = AiMessage::create([
            'ai_conversation_id'   => $conversation->id,
            'role'                 => 'assistant',
            'content'              => $result['response'],
            'reasoning'            => $result['reasoning'],
            'confidence_score'     => $result['confidence_score'],
            'sources'              => $result['sources'],
            'is_clarification'     => $result['is_clarification'] ?? false,
            'clarification_question' => $result['clarification_question'],
            'metadata'             => [
                'advisor_insights'      => $result['advisor_insights'] ?? '',
                'memory_notifications'  => $result['memory_notifications'] ?? [],
            ],
        ]);

        // Auto-update title if default
        if ($conversation->title === 'Nouvelle discussion') {
            $title = Str::limit($question, 50);
            $conversation->update(['title' => $title]);
        }

        $conversation->touch();

        return response()->json([
            'message'              => $assistantMessage,
            'memory_notifications' => $result['memory_notifications'] ?? [],
        ], 201);
    }

    /**
     * Archiver/Désarchiver une conversation.
     */
    public function archiveConversation(Request $request, $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);
        $newStatus = $conversation->status === 'archived' ? 'active' : 'archived';
        $conversation->update(['status' => $newStatus]);

        return response()->json([
            'conversation' => $conversation,
            'message' => $newStatus === 'archived' ? 'Discussion archivée.' : 'Discussion désarchivée.',
        ]);
    }

    /**
     * Supprimer une conversation (soft delete).
     */
    public function deleteConversation(Request $request, $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);
        $conversation->update(['status' => 'deleted']);

        return response()->json(['message' => 'Discussion supprimée.']);
    }

    /**
     * Restaurer une conversation supprimée.
     */
    public function restoreConversation(Request $request, $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)
            ->where('status', 'deleted')
            ->findOrFail($id);

        $conversation->update(['status' => 'active']);

        return response()->json([
            'conversation' => $conversation,
            'message' => 'Discussion restaurée avec succès.',
        ]);
    }

    /**
     * Exporter une conversation (Markdown ou JSON).
     */
    public function exportConversation(Request $request, $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);
        $format = $request->input('format', 'markdown');

        $export = $this->aiService->exportConversation($conversation->id, $format);

        // Marquer l'export
        $conversation->update(['exported_at' => now()]);

        return response()->json([
            'content'  => $export['content'],
            'filename' => $export['filename'],
            'mime'     => $export['mime'],
        ]);
    }

    /**
     * Résumé d'une conversation.
     */
    public function conversationSummary(Request $request, $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json([
            'summary'          => $conversation->context_summary,
            'context_metadata' => $conversation->context_metadata,
            'message_count'    => $conversation->messages()->count(),
        ]);
    }

    /**
     * Récupérer les éléments de mémoire de l'utilisateur.
     */
    public function getMemory(Request $request): JsonResponse
    {
        $memory = AiMemory::where('user_id', $request->user()->id)->get();
        return response()->json(['memory' => $memory]);
    }

    /**
     * Enregistrer ou mettre à jour un élément de mémoire.
     */
    public function saveMemory(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string|max:100',
            'value' => 'required|string|max:1000',
            'category' => 'required|string|in:preference,technology,decision,objective',
        ]);

        $memory = AiMemory::updateOrCreate(
            ['user_id' => $request->user()->id, 'key' => $request->input('key')],
            ['value' => $request->input('value'), 'category' => $request->input('category')]
        );

        return response()->json(['memory' => $memory, 'message' => 'Préférence enregistrée.']);
    }

    /**
     * Supprimer un élément de mémoire.
     */
    public function deleteMemory(Request $request, $id): JsonResponse
    {
        $memory = AiMemory::where('user_id', $request->user()->id)->findOrFail($id);
        $memory->delete();

        return response()->json(['message' => 'Élément de mémoire supprimé.']);
    }

    // =====================================================================
    // PRIVATE HELPERS
    // =====================================================================

    /**
     * Construit le contexte enrichi pour l'injection dans le pipeline IA.
     * Inclut : projet actif, tâches, publications, réunions, page courante.
     */
    private function buildProjectContext(?int $projectId, ?string $currentPage = null): array
    {
        $context = [];

        // Page courante (pour que CollabAI sache où est l'utilisateur)
        if ($currentPage) {
            $context['current_page'] = $currentPage;
        }

        if ($projectId) {
            $context['project_id'] = $projectId;
            $project = Project::with([
                'members',
                'tasks.assignee',
                'publications',
                'meetings',
            ])->find($projectId);

            if ($project) {
                $context['project'] = [
                    'id'          => $project->id,
                    'title'       => $project->title,
                    'description' => $project->description,
                    'status'      => $project->status instanceof \BackedEnum
                        ? $project->status->value : ($project->status ?? 'en_cours'),
                    'members'     => $project->members->map(fn($m) => [
                        'id'   => $m->id,
                        'name' => $m->full_name ?? $m->name,
                        'role' => $m->pivot->role ?? null,
                    ])->toArray(),
                ];

                // Tâches avec statut, priorité, date limite et assignation
                $context['tasks'] = $project->tasks->map(fn($task) => [
                    'id'       => $task->id,
                    'title'    => $task->title,
                    'status'   => $task->status instanceof \BackedEnum ? $task->status->value : $task->status,
                    'priority' => $task->priority instanceof \BackedEnum ? $task->priority->value : ($task->priority ?? 'normale'),
                    'assignee' => $task->assignee?->full_name ?? $task->assignee?->name ?? null,
                    'due_date' => $task->due_date?->format('Y-m-d'),
                ])->toArray();

                // Publications
                $context['publications'] = $project->publications->map(fn($pub) => [
                    'id'      => $pub->id,
                    'title'   => $pub->title,
                    'year'    => $pub->year,
                    'authors' => $pub->authors_list ?? null,
                ])->toArray();

                // Réunions (passées ET à venir)
                $context['meetings'] = $project->meetings->map(fn($m) => [
                    'id'     => $m->id,
                    'title'  => $m->title,
                    'date'   => $m->scheduled_at?->format('Y-m-d H:i')
                             ?? ($m->date ?? null),
                    'status' => $m->status instanceof \BackedEnum ? $m->status->value : ($m->status ?? 'planifiée'),
                ])->toArray();
            }
        }

        return $context;
    }
}
