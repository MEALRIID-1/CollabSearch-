<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ressource Tâche - CollabSearch
 */
class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'priority' => $this->priority,
            'priority_label' => $this->priority_label,
            'project_id' => $this->project_id,
            'milestone_id' => $this->milestone_id,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'validator' => new UserResource($this->whenLoaded('validator')),
            'due_date' => $this->due_date?->toISOString(),
            'is_overdue' => $this->is_overdue,
            'completed_at' => $this->completed_at?->toISOString(),
            'validated_at' => $this->validated_at?->toISOString(),
            'comments_count' => $this->whenCounted('comments'),
            'attachments_count' => $this->whenCounted('attachments'),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'attachments' => $this->whenLoaded('attachments', function () {
                $taskId = $this->id;
                return $this->attachments->map(fn ($a) => [
                    'id'            => $a->id,
                    'filename'      => $a->filename,
                    'original_name' => $a->original_name,
                    'mime_type'     => $a->mime_type,
                    'size'          => $a->size,
                    'url'           => route('tasks.attachments.download', ['task' => $taskId, 'attachment' => $a->id]),
                    'created_at'    => $a->created_at?->toISOString(),
                ]);
            }),
            // Indique si l'utilisateur connecté peut valider/refuser cette tâche
            // Utilise $request->user() (guard Sanctum) plutôt que auth()->user() (guard web)
            'can_review' => $request->user() !== null && $request->user()->hasAnyRole(['administrator', 'team_lead']),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
