<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatChannelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'is_archived' => (bool) $this->is_archived,
            'created_by' => $this->created_by,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'members' => UserResource::collection($this->whenLoaded('members', collect([]))),
            'messages_count' => $this->whenLoaded('messages', fn () => $this->messages->count()),
            'messages' => ChatMessageResource::collection($this->whenLoaded('messages')),
            'updated_at' => $this->updated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
