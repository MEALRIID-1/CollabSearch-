<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Ressource Message - CollabSearch
 */
class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'sender_id' => $this->sender_id,
            'recipient' => new UserResource($this->whenLoaded('recipient')),
            'recipient_id' => $this->recipient_id,
            'project_id' => $this->project_id,
            'subject' => $this->subject,
            'content' => $this->content,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at?->toISOString(),
            'parent_id' => $this->parent_id,
            'conversation_id' => $this->conversation_id,
            'attachments' => $this->when(
                $this->relationLoaded('attachments'),
                function () {
                    return $this->attachments->map(function ($attachment) {
                        return [
                            'id' => $attachment->id,
                            'filename' => $attachment->filename,
                            'original_name' => $attachment->original_name,
                            'mime_type' => $attachment->mime_type,
                            'media_type' => $attachment->media_type,
                            'size' => $attachment->size,
                            'link_url' => $attachment->link_url,
                            'is_encrypted' => $attachment->is_encrypted,
                            'url' => $attachment->media_type === 'link'
                                ? $attachment->link_url
                                : ($attachment->is_encrypted
                                    ? route('media.download', ['attachmentId' => $attachment->id])
                                    : Storage::disk('public')->url($attachment->path)),
                            'created_at' => $attachment->created_at->toISOString(),
                        ];
                    });
                }
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
