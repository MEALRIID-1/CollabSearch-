<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'channel_id' => $this->channel_id,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'sender_id' => $this->sender_id,
            'parent_id' => $this->parent_id,
            'body' => $this->body,
            'type' => $this->type,
            'is_edited' => (bool) $this->is_edited,
            'edited_at' => $this->edited_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'reactions' => $this->whenLoaded('reactions', function () {
                return $this->reactions->map(function ($reaction) {
                    return [
                        'id' => $reaction->id,
                        'emoji' => $reaction->emoji,
                        'user' => new UserResource($reaction->whenLoaded('user') ? $reaction->user : $reaction->user),
                    ];
                });
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
