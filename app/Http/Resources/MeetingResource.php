<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ressource Réunion - CollabSearch
 */
class MeetingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'scheduled_at' => $this->scheduled_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            'duration' => $this->duration,
            'location' => $this->location,
            'meeting_url' => $this->meeting_url,
            'is_online' => $this->is_online,
            'agenda' => $this->agenda,
            'minutes' => $this->minutes,
            'organizer' => new UserResource($this->whenLoaded('organizer')),
            'project' => new ProjectResource($this->whenLoaded('project')),
            'participants' => UserResource::collection($this->whenLoaded('participants')),
            'accepted_participants_count' => $this->accepted_participants_count,
            'jitsi_room_id' => $this->jitsi_room_id,
            'recording_url' => $this->recording_url,
            'recording_transcript' => $this->recording_transcript,
            'meeting_summary' => $this->meeting_summary,
            'started_at' => $this->started_at?->toISOString(),
            'actual_duration_minutes' => $this->actual_duration_minutes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
