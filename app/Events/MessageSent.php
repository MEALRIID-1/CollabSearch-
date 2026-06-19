<?php

namespace App\Events;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
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
                'channel_id' => $this->message->channel_id,
                'sender_id' => $this->message->sender_id,
                'body' => $this->message->body,
                'type' => $this->message->type,
                'is_edited' => $this->message->is_edited,
                'edited_at' => $this->message->edited_at?->toISOString(),
                'created_at' => $this->message->created_at?->toISOString(),
                'sender' => [
                    'id' => $this->message->sender->id,
                    'full_name' => $this->message->sender->full_name,
                    'avatar' => $this->message->sender->avatar,
                ],
            ],
        ];
    }
}
