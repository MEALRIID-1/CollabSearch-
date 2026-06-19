<?php

namespace App\Services;

use App\Events\MessageDeleted;
use App\Events\MessageEdited;
use App\Events\MessageSent;
use App\Events\ReactionAdded;
use App\Models\ChatChannel;
use App\Models\ChatChannelMember;
use App\Models\ChatMessage;
use App\Models\ChatMessageReaction;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Service de chat de groupe - CollabSearch
 *
 * Gère les canaux, les messages et les réactions en temps réel.
 */
class ChatService
{
    public function listChannels(User $user, ?int $projectId = null): Collection
    {
        $query = ChatChannel::with(['creator', 'members'])
            ->whereHas('members', fn ($query) => $query->where('user_id', $user->id));

        if ($projectId !== null) {
            $query->where('project_id', $projectId);
        }

        return $query->orderBy('is_archived')
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    public function createChannel(User $creator, array $data): ChatChannel
    {
        return DB::transaction(function () use ($creator, $data) {
            $channel = ChatChannel::create([
                'project_id' => $data['project_id'] ?? null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'] ?? 'project_general',
                'created_by' => $creator->id,
            ]);

            $this->addMember($creator, $channel, $creator->id);

            if ($channel->type === 'project_general' && $channel->project_id) {
                $project = Project::find($channel->project_id);
                if ($project) {
                    $memberIds = $project->members()->pluck('users.id')->toArray();
                    foreach ($memberIds as $memberId) {
                        $this->addMember($creator, $channel, $memberId, false);
                    }
                }
            }

            if (!empty($data['member_ids']) && is_array($data['member_ids'])) {
                foreach ($data['member_ids'] as $memberId) {
                    $this->addMember($creator, $channel, (int) $memberId, false);
                }
            }

            return $channel;
        });
    }

    public function getChannel(User $user, ChatChannel $channel): ChatChannel
    {
        if (!$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        return $channel->load(['creator', 'members', 'messages.sender', 'messages.reactions.user']);
    }

    public function updateChannel(User $user, ChatChannel $channel, array $data): ChatChannel
    {
        if (!$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        $channel->fill([
            'name' => $data['name'] ?? $channel->name,
            'description' => $data['description'] ?? $channel->description,
        ]);

        $channel->save();

        return $channel;
    }

    public function archiveChannel(User $user, ChatChannel $channel): ChatChannel
    {
        if (!$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        $channel->is_archived = true;
        $channel->save();

        return $channel;
    }

    public function getChannelMembers(User $user, ChatChannel $channel): Collection
    {
        if (!$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        return $channel->members()->orderBy('first_name')->get();
    }

    public function addMember(User $user, ChatChannel $channel, int $memberId, bool $ensureAccess = true): ChatChannelMember
    {
        if ($ensureAccess && !$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        if (!$channel->members()->where('user_id', $memberId)->exists()) {
            $channel->members()->attach($memberId, [
                'joined_at' => now(),
                'last_read_at' => now(),
            ]);
        }

        return ChatChannelMember::where('channel_id', $channel->id)
            ->where('user_id', $memberId)
            ->firstOrFail();
    }

    public function removeMember(User $user, ChatChannel $channel, int $memberId): void
    {
        if (!$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        $channel->members()->detach($memberId);
    }

    public function getMessages(User $user, ChatChannel $channel, int $perPage = 30, ?string $cursor = null)
    {
        if (!$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        $query = ChatMessage::with(['sender', 'parent.sender', 'reactions.user'])
            ->where('channel_id', $channel->id)
            ->orderBy('created_at', 'desc');

        if (!empty($cursor)) {
            $query->where('created_at', '<', Carbon::parse($cursor));
        }

        return $query->limit($perPage)->get();
    }

    public function sendMessage(User $user, ChatChannel $channel, array $data): ChatMessage
    {
        if (!$this->userCanAccessChannel($user, $channel)) {
            abort(403, 'Accès au canal refusé.');
        }

        return DB::transaction(function () use ($user, $channel, $data) {
            $message = ChatMessage::create([
                'channel_id' => $channel->id,
                'sender_id' => $user->id,
                'parent_id' => $data['parent_id'] ?? null,
                'body' => $data['body'] ?? null,
                'type' => $data['type'] ?? 'text',
                'is_edited' => false,
            ]);

            $this->markAsRead($user, $channel);

            event(new MessageSent($channel, $message));

            return $message->load(['sender', 'parent.sender', 'reactions.user']);
        });
    }

    public function editMessage(User $user, ChatMessage $message, string $body): ChatMessage
    {
        if ($message->sender_id !== $user->id) {
            abort(403, 'Vous ne pouvez modifier que vos propres messages.');
        }

        $message->body = $body;
        $message->is_edited = true;
        $message->edited_at = now();
        $message->save();

        event(new MessageEdited($message->channel, $message));

        return $message->load(['sender', 'parent.sender', 'reactions.user']);
    }

    public function deleteMessage(User $user, ChatMessage $message): ChatMessage
    {
        if ($message->sender_id !== $user->id) {
            abort(403, 'Vous ne pouvez supprimer que vos propres messages.');
        }

        $message->body = '[message supprimé]';
        $message->deleted_at = now();
        $message->save();

        event(new MessageDeleted($message->channel, $message));

        return $message->load(['sender', 'parent.sender', 'reactions.user']);
    }

    public function toggleReaction(User $user, ChatMessage $message, string $emoji): ChatMessageReaction
    {
        if (!$this->userCanAccessChannel($user, $message->channel)) {
            abort(403, 'Accès au message refusé.');
        }

        $reaction = ChatMessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if ($reaction) {
            $reaction->delete();
            $removed = true;
        } else {
            $reaction = ChatMessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
            $removed = false;
        }

        event(new ReactionAdded($message->channel, $message, $user, $emoji, $removed));

        return $reaction;
    }

    public function removeReaction(User $user, ChatMessage $message, string $emoji): void
    {
        if (!$this->userCanAccessChannel($user, $message->channel)) {
            abort(403, 'Accès au message refusé.');
        }

        ChatMessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->delete();

        event(new ReactionAdded($message->channel, $message, $user, $emoji, true));
    }

    public function markAsRead(User $user, ChatChannel $channel): void
    {
        ChatChannelMember::where('channel_id', $channel->id)
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);
    }

    public function getUnreadCount(User $user, ChatChannel $channel): int
    {
        $member = ChatChannelMember::where('channel_id', $channel->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$member) {
            return 0;
        }

        return ChatMessage::where('channel_id', $channel->id)
            ->when($member->last_read_at, fn ($query) => $query->where('created_at', '>', $member->last_read_at))
            ->count();
    }

    private function userCanAccessChannel(User $user, ChatChannel $channel): bool
    {
        if ($channel->members()->where('user_id', $user->id)->exists()) {
            return true;
        }

        if ($channel->project_id && $channel->project->hasMember($user)) {
            return true;
        }

        return false;
    }
}
