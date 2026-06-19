<?php

namespace App\Observers;

use App\Enums\TaskStatus;
use App\Models\Milestone;
use App\Models\Task;

/**
 * Observateur de tâche - CollabSearch
 *
 * Surveille les événements du cycle de vie des tâches :
 * - progression du projet (budget)
 * - synchronisation de l'état du jalon associé
 */
class TaskObserver
{
    /**
     * Tâche créée : décocher le jalon s'il était complété.
     * Une nouvelle tâche (non validée) signifie que le jalon n'est plus terminé.
     */
    public function created(Task $task): void
    {
        $this->updateProjectProgress($task);

        if ($task->milestone_id) {
            $this->uncheckMilestoneIfCompleted($task->milestone_id);
        }
    }

    /**
     * Tâche modifiée :
     * - si le statut change → resynchroniser le jalon (auto-compléter ou décocher)
     * - si le jalon change → décocher le nouveau jalon s'il est complété
     */
    public function updated(Task $task): void
    {
        if ($task->isDirty('status')) {
            $this->updateProjectProgress($task);

            // Synchroniser le jalon après tout changement de statut
            if ($task->milestone_id) {
                $this->syncMilestoneStatus($task->milestone_id);
            }
        }

        // Si le jalon a changé, décocher le nouveau jalon s'il est déjà complété
        if ($task->isDirty('milestone_id') && $task->milestone_id) {
            $this->uncheckMilestoneIfCompleted($task->milestone_id);
        }
    }

    /**
     * Tâche supprimée : recalculer le statut du jalon.
     * Si les tâches restantes sont toutes validées, le jalon se coche.
     * Si une tâche non validée est supprimée et le jalon était décoché, on resynchronise.
     */
    public function deleted(Task $task): void
    {
        $this->updateProjectProgress($task);

        if ($task->milestone_id) {
            $this->syncMilestoneStatus($task->milestone_id);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Décocher un jalon complété dès qu'une tâche active lui est assignée.
     */
    private function uncheckMilestoneIfCompleted(int $milestoneId): void
    {
        Milestone::where('id', $milestoneId)
            ->whereNotNull('completed_at')
            ->update(['completed_at' => null, 'status' => 'pending']);
    }

    /**
     * Synchronisation complète du statut d'un jalon :
     * - toutes les tâches validées → cocher
     * - au moins une tâche non validée → décocher
     * - aucune tâche → ne rien faire (pas de complétion automatique sur jalon vide)
     */
    private function syncMilestoneStatus(int $milestoneId): void
    {
        $total     = Task::where('milestone_id', $milestoneId)->count();
        $validated = Task::where('milestone_id', $milestoneId)
                         ->where('status', TaskStatus::VALIDATED->value)
                         ->count();

        if ($total === 0) {
            return;
        }

        if ($validated >= $total) {
            // Toutes validées → cocher
            Milestone::where('id', $milestoneId)
                ->whereNull('completed_at')
                ->update(['completed_at' => now(), 'status' => 'completed']);
        } else {
            // Au moins une non validée → décocher
            Milestone::where('id', $milestoneId)
                ->whereNotNull('completed_at')
                ->update(['completed_at' => null, 'status' => 'pending']);
        }
    }

    /**
     * Mettre à jour le budget utilisé du projet
     */
    private function updateProjectProgress(Task $task): void
    {
        $project = $task->project;
        if (!$project) {
            return;
        }

        $totalSpent = $project->budgetLines()->sum('amount_spent');
        $project->update(['budget_used' => $totalSpent]);
    }
}
