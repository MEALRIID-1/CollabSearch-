<?php

namespace App\Events;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ReactionAdded implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ChatChannel $channel,
        public readonly ChatMessage $message,
        public readonly User $user,
        public readonly string $emoji,
        public readonly bool $removed = false
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("chat.{$this->channel->id}");
    }

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->message->id,
            'emoji' => $this->emoji,
            'user' => [
                'id' => $this->user->id,
                'full_name' => $this->user->full_name,
                'avatar' => $this->user->avatar,
            ],
            'removed' => $this->removed,
        ];
    }
}
