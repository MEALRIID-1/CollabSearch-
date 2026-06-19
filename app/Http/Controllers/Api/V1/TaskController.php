<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Http\Resources\CommentResource;
use App\Http\Resources\TaskResource;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Contrôleur de tâches - CollabSearch
 * 
 * Gère les opérations CRUD sur les tâches, le tableau Kanban,
 * les commentaires, les pièces jointes et la validation.
 */
class TaskController extends Controller
{
    public function __construct(
        private readonly TaskService $taskService
    ) {}

    /**
     * Liste des tâches d'un projet
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        try {
            $tasks = $this->taskService->getProjectTasks(
                $project,
                $request->get('status'),
                $request->get('priority'),
                $request->get('assignee_id'),
                $request->get('per_page', 50)
            );

            return response()->json([
                'tasks' => TaskResource::collection($tasks),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des tâches.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer les tâches au format Kanban
     */
    public function kanban(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        try {
            $kanbanData = $this->taskService->getKanbanData($project);

            // Transform each task collection using TaskResource
            $kanban = [
                'todo'        => TaskResource::collection($kanbanData['todo']),
                'in_progress' => TaskResource::collection($kanbanData['in_progress']),
                'submitted'   => TaskResource::collection($kanbanData['submitted']),
                'validated'   => TaskResource::collection($kanbanData['validated']),
                'refused'     => TaskResource::collection($kanbanData['refused']),
            ];

            return response()->json([
                'kanban' => $kanban,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération du Kanban.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer une nouvelle tâche
     */
    public function store(StoreTaskRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        try {
            $task = $this->taskService->createTask($project, $request->user(), $request->validated());

            return response()->json([
                'message' => 'Tâche créée avec succès.',
                'task' => new TaskResource($task),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la tâche.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher les détails d'une tâche
     */
    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task->project);

        return response()->json([
            'task' => new TaskResource($task->load(['assignee', 'milestone', 'comments.user', 'attachments'])),
        ]);
    }

    /**
     * Mettre à jour une tâche
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task->project);

        try {
            $task = $this->taskService->updateTask($task, $request->validated());

            return response()->json([
                'message' => 'Tâche mise à jour avec succès.',
                'task' => new TaskResource($task),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la tâche.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour le statut d'une tâche
     */
    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task->project);

        try {
            $task = $this->taskService->updateStatus($task, $request->validated(), $request->user());

            return response()->json([
                'message' => 'Statut de la tâche mis à jour.',
                'task' => new TaskResource($task),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du statut.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Assigner une tâche à un utilisateur
     */
    public function assign(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task->project);

        $request->validate([
            'assignee_id' => 'required|exists:users,id',
        ]);

        try {
            $task = $this->taskService->assignTask($task, $request->get('assignee_id'), $request->user());

            return response()->json([
                'message' => 'Tâche assignée avec succès.',
                'task' => new TaskResource($task),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'assignation de la tâche.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Valider une tâche terminée
     */
    public function validateTask(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task->project);

        if (!$request->user()->hasAnyRole(['administrator', 'team_lead'])) {
            return response()->json(['message' => 'Seuls les administrateurs et chefs d\'équipe peuvent valider les tâches.'], 403);
        }

        try {
            $task = $this->taskService->validateTask($task, $request->user());

            return response()->json([
                'message' => 'Tâche validée avec succès.',
                'task' => new TaskResource($task),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la validation de la tâche.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Refuser une tâche soumise
     */
    public function refuseTask(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task->project);

        if (!$request->user()->hasAnyRole(['administrator', 'team_lead'])) {
            return response()->json(['message' => 'Seuls les administrateurs et chefs d\'équipe peuvent refuser les tâches.'], 403);
        }

        try {
            $task = $this->taskService->refuseTask($task, $request->user());

            return response()->json([
                'message' => 'Tâche refusée.',
                'task' => new TaskResource($task),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du refus de la tâche.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer une tâche
     */
    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task->project);

        try {
            $this->taskService->deleteTask($task);

            return response()->json([
                'message' => 'Tâche supprimée avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la tâche.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lister les tâches supprimées (corbeille) d'un projet
     */
    public function trash(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $tasks = Task::withTrashed()
            ->where('project_id', $project->id)
            ->whereNotNull('deleted_at')
            ->with(['assignee'])
            ->latest('deleted_at')
            ->get();

        return response()->json([
            'tasks' => TaskResource::collection($tasks),
        ]);
    }

    /**
     * Restaurer une tâche supprimée
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        $task = Task::withTrashed()->findOrFail($id);
        $this->authorize('update', $task->project);

        $task->restore();

        return response()->json([
            'message' => 'Tâche restaurée avec succès.',
            'task' => new TaskResource($task),
        ]);
    }

    /**
     * Supprimer définitivement une tâche
     */
    public function forceDelete(Request $request, int $id): JsonResponse
    {
        $task = Task::withTrashed()->findOrFail($id);
        $this->authorize('delete', $task->project);

        $task->forceDelete();

        return response()->json([
            'message' => 'Tâche supprimée définitivement.',
        ]);
    }

    /**
     * Lister les commentaires d'une tâche
     */
    public function comments(Task $task): JsonResponse
    {
        $this->authorize('view', $task->project);

        return response()->json([
            'comments' => CommentResource::collection($task->comments()->with('user')->latest()->get()),
        ]);
    }

    /**
     * Télécharger une pièce jointe
     */
    public function downloadAttachment(Task $task, Attachment $attachment): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $this->authorize('view', $task->project);

        if ($attachment->task_id !== $task->id) {
            return response()->json(['message' => 'Pièce jointe introuvable.'], 404);
        }

        if (!Storage::disk('public')->exists($attachment->path)) {
            return response()->json(['message' => 'Fichier introuvable sur le serveur.'], 404);
        }

        return response()->download(
            Storage::disk('public')->path($attachment->path),
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    /**
     * Téléverser une pièce jointe sur une tâche
     */
    public function uploadAttachment(Request $request, Task $task): JsonResponse
    {
        // La permission 'tasks.attach_files' est vérifiée par le middleware custom.
        // On vérifie seulement que l'utilisateur peut voir le projet.
        $this->authorize('view', $task->project);

        $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,zip',
        ]);

        try {
            $file = $request->file('file');
            $path = $file->store("tasks/{$task->id}", 'public');

            $attachment = Attachment::create([
                'task_id' => $task->id,
                'user_id' => $request->user()->id,
                'filename' => basename($path),
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
            ]);

            return response()->json([
                'message' => 'Fichier téléversé avec succès.',
                'attachment' => $attachment,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du téléversement du fichier.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
