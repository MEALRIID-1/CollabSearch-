<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Collection;

class ConversationService
{
    /**
     * Créer une conversation de groupe
     */
    public function createGroupConversation(string $groupName, User $creator, array $participantIds): Conversation
    {
        $conversation = Conversation::create([
            'is_group' => true,
            'group_name' => $groupName,
            'created_by' => $creator->id,
        ]);

        // Ajouter le créateur comme participant
        $participantIds[] = $creator->id;
        $participantIds = array_unique($participantIds);

        $conversation->participants()->sync($participantIds);

        return $conversation;
    }

    /**
     * Ajouter des participants à une conversation de groupe
     */
    public function addParticipants(Conversation $conversation, array $userIds): Conversation
    {
        if (!$conversation->is_group) {
            throw new \Exception('Cannot add participants to a non-group conversation');
        }

        $conversation->participants()->syncWithoutDetaching($userIds);
        return $conversation;
    }

    /**
     * Retirer un participant d'une conversation de groupe
     */
    public function removeParticipant(Conversation $conversation, User $user): Conversation
    {
        if (!$conversation->is_group) {
            throw new \Exception('Cannot remove participants from a non-group conversation');
        }

        $conversation->participants()->detach($user->id);
        return $conversation;
    }

    /**
     * Obtenir les conversations de groupe d'un utilisateur
     */
    public function getUserGroupConversations(User $user): Collection
    {
        return $user->groupConversations()->with(['participants', 'messages' => function ($query) {
            $query->latest()->limit(1);
        }])->orderBy('updated_at', 'desc')->get();
    }
}
