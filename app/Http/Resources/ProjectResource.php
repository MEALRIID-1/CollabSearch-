<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ressource Projet - CollabSearch
 */
class ProjectResource extends JsonResource
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
            'reference' => $this->reference,
            'lead' => new UserResource($this->whenLoaded('lead')),
            'members' => UserResource::collection($this->whenLoaded('members')),
            'milestones' => MilestoneResource::collection($this->whenLoaded('milestones')),
            'start_date' => $this->start_date?->toISOString(),
            'end_date' => $this->end_date?->toISOString(),
            'budget_allocated' => (float) $this->budget_allocated,
            'budget_used' => (float) $this->budget_used,
            'budget_percentage' => $this->budget_percentage,
            'is_budget_alert' => $this->is_budget_alert,
            'progress' => $this->progress,
            'keywords' => $this->keywords,
            'laboratory' => $this->laboratory,
            'funding_source' => $this->funding_source,
            'tasks_count' => $this->whenCounted('tasks'),
            'publications_count' => $this->whenCounted('publications'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
