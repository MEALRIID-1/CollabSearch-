<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Milestone;

/**
 * Observateur de jalon - CollabSearch
 * 
 * Surveille les événements du cycle de vie des jalons
 * et enregistre les activités correspondantes.
 */
class MilestoneObserver
{
    /**
     * Handle the Milestone "created" event.
     */
    public function created(Milestone $milestone): void
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'project_id' => $milestone->project_id,
            'action' => ActivityLog::ACTION_CREATE,
            'description' => "Jalon '{$milestone->title}' créé",
            'subject_type' => Milestone::class,
            'subject_id' => $milestone->id,
        ]);
    }

    /**
     * Handle the Milestone "updated" event.
     */
    public function updated(Milestone $milestone): void
    {
        // Si le jalon a été marqué comme complété
        if ($milestone->isDirty('completed_at') && $milestone->completed_at) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $milestone->project_id,
                'action' => ActivityLog::ACTION_STATUS_CHANGE,
                'description' => "Jalon '{$milestone->title}' complété",
                'subject_type' => Milestone::class,
                'subject_id' => $milestone->id,
                'properties' => [
                    'completed_at' => $milestone->completed_at->toISOString(),
                ],
            ]);
        }
    }

    /**
     * Handle the Milestone "deleted" event.
     */
    public function deleted(Milestone $milestone): void
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'project_id' => $milestone->project_id,
            'action' => ActivityLog::ACTION_DELETE,
            'description' => "Jalon '{$milestone->title}' supprimé",
        ]);
    }
}
