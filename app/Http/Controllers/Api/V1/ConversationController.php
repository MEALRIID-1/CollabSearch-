<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\ConversationService;
use App\Services\MessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ConversationController extends Controller
{
    protected ConversationService $conversationService;
    protected MessageService $messageService;

    public function __construct(ConversationService $conversationService, MessageService $messageService)
    {
        $this->conversationService = $conversationService;
        $this->messageService = $messageService;
    }

    // Créer une conversation de groupe
    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'group_name' => 'required|string|max:255',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'integer|exists:users,id',
        ]);

        $conversation = $this->conversationService->createGroupConversation($data['group_name'], $user, $data['participant_ids']);

        return response()->json(['data' => $conversation], 201);
    }

    // Ajouter des participants
    public function addParticipants(Request $request, Conversation $conversation)
    {
        $this->authorize('update', $conversation);
        $data = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $conversation = $this->conversationService->addParticipants($conversation, $data['user_ids']);

        return response()->json(['data' => $conversation]);
    }

    // Retirer un participant
    public function removeParticipant(Request $request, Conversation $conversation)
    {
        $this->authorize('update', $conversation);
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $user = User::findOrFail($data['user_id']);
        $conversation = $this->conversationService->removeParticipant($conversation, $user);

        return response()->json(['data' => $conversation]);
    }

    // Lister les messages d'une conversation de groupe
    public function messages(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        // vérifier si l'utilisateur est participant
        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $perPage = (int) $request->get('per_page', 30);

        $messages = Message::with(['sender', 'attachments'])
            ->where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json(['data' => \App\Http\Resources\MessageResource::collection($messages)]);
    }

    // Envoyer un message dans une conversation de groupe
    public function sendMessage(Request $request, Conversation $conversation)
    {
        try {
            $user = $request->user();
            if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $data = $request->validate([
                'content' => 'nullable|string',
                'attachment_ids' => 'array',
                'attachment_ids.*' => 'integer|exists:attachments,id',
            ]);

            $message = Message::create([
                'sender_id' => $user->id,
                'recipient_id' => null,
                'conversation_id' => $conversation->id,
                'content' => trim((string) ($data['content'] ?? '')),
            ]);

            if (!empty($data['attachment_ids'])) {
                \App\Models\Attachment::whereIn('id', $data['attachment_ids'])
                    ->where('user_id', $user->id)
                    ->whereNull('message_id')
                    ->update(['message_id' => $message->id]);
            }

            // Optionally notify participants
            foreach ($conversation->participants as $participant) {
                if ($participant->id === $user->id) continue;
                try {
                    $participant->notify(new \App\Notifications\NewMessage($message, $user));
                } catch (\Throwable $t) {
                    Log::error('Failed to notify participant', ['participant_id' => $participant->id, 'error' => $t->getMessage()]);
                }
            }

            $message->load(['sender', 'attachments']);
            return response()->json(['data' => new \App\Http\Resources\MessageResource($message)], 201);
        } catch (\Throwable $e) {
            Log::error('Conversation sendMessage error', [
                'conversation_id' => $conversation->id,
                'user_id' => optional($request->user())->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
        }
    }

    // Lister les conversations de groupe auxquelles l'utilisateur participe
    public function index(Request $request)
    {
        $user = $request->user();
        $conversations = $user->groupConversations()->with(['participants', 'messages' => function ($q) {
            $q->latest()->limit(1);
        }])->orderBy('updated_at', 'desc')->get();

        return response()->json(['data' => $conversations]);
    }
}
