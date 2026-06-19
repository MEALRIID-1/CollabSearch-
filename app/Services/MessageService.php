<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Attachment;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Service de messagerie - CollabSearch
 * 
 * Gère la messagerie interne entre utilisateurs :
 * envoi, conversations et liste des discussions.
 */
class MessageService
{
    /**
     * Envoyer un message
     */
    public function send(User $sender, array $data): Message
    {
        return DB::transaction(function () use ($sender, $data) {
            $messagePayload = [
                'sender_id' => $sender->id,
                'recipient_id' => $data['recipient_id'] ?? null,
                'conversation_id' => $data['conversation_id'] ?? null,
                'project_id' => $data['project_id'] ?? null,
                'subject' => $data['subject'] ?? null,
                'content' => trim((string) ($data['content'] ?? '')),
                'parent_id' => $data['parent_id'] ?? null,
            ];

            // If conversation_id is provided, recipient_id should be null
            if (!empty($messagePayload['conversation_id'])) {
                $messagePayload['recipient_id'] = null;
            }

            $message = Message::create($messagePayload);

            // Attacher les fichiers au message
            if (!empty($data['attachment_ids'])) {
                Attachment::whereIn('id', $data['attachment_ids'])
                    ->where('user_id', $sender->id)
                    ->whereNull('message_id')
                    ->update(['message_id' => $message->id]);
            }

            // Notifier le(s) destinataire(s)
            if (!empty($data['conversation_id'])) {
                $conversation = \App\Models\Conversation::find($data['conversation_id']);
                if ($conversation) {
                    foreach ($conversation->participants as $participant) {
                        if ($participant->id === $sender->id) continue;
                        $participant->notify(new NewMessage($message, $sender));
                    }
                }
            } else {
                $recipient = User::find($data['recipient_id'] ?? null);
                $recipient?->notify(new NewMessage($message, $sender));
            }

            ActivityLog::create([
                'user_id' => $sender->id,
                'project_id' => $data['project_id'] ?? null,
                'action' => ActivityLog::ACTION_CREATE,
                'description' => "Message envoyé à {$recipient?->full_name}",
                'subject_type' => Message::class,
                'subject_id' => $message->id,
            ]);

            return $message->load(['sender', 'recipient', 'project', 'attachments']);
        });
    }

    /**
     * Récupérer une conversation entre deux utilisateurs
     */
    public function getConversation(User $user, int $otherUserId, int $perPage = 30)
    {
        // Marquer les messages comme lus
        Message::where('sender_id', $otherUserId)
            ->where('recipient_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return Message::with(['sender', 'recipient'])
            ->where(function ($q) use ($user, $otherUserId) {
                $q->where('sender_id', $user->id)->where('recipient_id', $otherUserId);
            })
            ->orWhere(function ($q) use ($user, $otherUserId) {
                $q->where('sender_id', $otherUserId)->where('recipient_id', $user->id);
            })
            ->with('attachments')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Récupérer la liste des conversations de l'utilisateur
     */
    public function getConversations(User $user): array
    {
        // Récupérer les derniers messages de chaque conversation
        $sentMessages = Message::where('sender_id', $user->id)
            ->whereNotNull('recipient_id')
            ->selectRaw('recipient_id as user_id, MAX(created_at) as last_message_at')
            ->groupBy('recipient_id');

        $receivedMessages = Message::where('recipient_id', $user->id)
            ->whereNotNull('sender_id')
            ->selectRaw('sender_id as user_id, MAX(created_at) as last_message_at')
            ->groupBy('sender_id');

        $conversationUserIds = $sentMessages->union($receivedMessages)
            ->pluck('user_id')
            ->filter()
            ->unique()
            ->toArray();

        $conversations = [];

        foreach ($conversationUserIds as $userId) {
            if ($userId === null) {
                continue;
            }

            $otherUser = User::find($userId);
            if (!$otherUser) {
                continue;
            }

            $lastMessage = Message::where(function ($q) use ($user, $userId) {
                $q->where('sender_id', $user->id)->where('recipient_id', $userId);
            })
            ->orWhere(function ($q) use ($user, $userId) {
                $q->where('sender_id', $userId)->where('recipient_id', $user->id);
            })
            ->latest()
            ->first();

            $unreadCount = Message::where('sender_id', $userId)
                ->where('recipient_id', $user->id)
                ->where('is_read', false)
                ->count();

            $conversations[] = [
                'user' => [
                    'id' => $otherUser->id,
                    'full_name' => $otherUser->full_name,
                    'avatar' => $otherUser->avatar,
                    'specialty' => $otherUser->specialty,
                ],
                'last_message' => [
                    'content' => $lastMessage?->content ? Str::limit($lastMessage->content, 100) : null,
                    'created_at' => $lastMessage?->created_at?->toISOString(),
                    'is_mine' => $lastMessage?->sender_id === $user->id,
                ],
                'unread_count' => $unreadCount,
            ];
        }

        // Trier par date du dernier message
        usort($conversations, fn ($a, $b) => 
            $b['last_message']['created_at'] <=> $a['last_message']['created_at']
        );

        return $conversations;
    }
}
