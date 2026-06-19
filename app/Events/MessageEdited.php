<?php

namespace App\Events;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class MessageEdited implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ChatChannel $channel,
        public readonly ChatMessage $message
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("chat.{$this->channel->id}");
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'uuid' => $this->message->uuid,
                'body' => $this->message->body,
                'is_edited' => $this->message->is_edited,
                'edited_at' => $this->message->edited_at?->toISOString(),
            ],
        ];
    }
}
