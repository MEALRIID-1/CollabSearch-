<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Contrôleur des messages - CollabSearch
 * 
 * Gère la messagerie interne entre utilisateurs :
 * envoi, conversation et liste des conversations.
 */
class MessageController extends Controller
{
    public function __construct(
        private readonly MessageService $messageService
    ) {}

    /**
     * Envoyer un message
     */
    public function send(StoreMessageRequest $request): JsonResponse
    {
        try {
            $message = $this->messageService->send(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'message' => 'Message envoyé avec succès.',
                'data' => new MessageResource($message),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'envoi du message.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer une conversation avec un utilisateur
     */
    public function conversation(Request $request, int $userId): JsonResponse
    {
        try {
            $currentUser = $request->user();
            $otherUser = User::findOrFail($userId);

            $messages = $this->messageService->getConversation(
                $currentUser,
                $otherUser->id,
                $request->get('per_page', 30)
            );

            return response()->json([
                'conversation_with' => new UserResource($otherUser),
                'messages' => MessageResource::collection($messages),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération de la conversation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Liste des conversations de l'utilisateur
     */
    public function conversations(Request $request): JsonResponse
    {
        try {
            $conversations = $this->messageService->getConversations($request->user());

            return response()->json([
                'conversations' => $conversations,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch user conversations', [
                'user_id' => optional($request->user())->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la récupération des conversations.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soft-delete a message (mark as deleted for the current owner)
     */
    public function destroy(Request $request, int $messageId): JsonResponse
    {
        try {
            $message = \App\Models\Message::findOrFail($messageId);

            // Only sender or recipient may soft-delete the message
            $user = $request->user();
            if ($message->sender_id !== $user->id && $message->recipient_id !== $user->id) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }

            $message->delete();

            return response()->json(['message' => 'Message supprimé (soft delete).']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du message.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
