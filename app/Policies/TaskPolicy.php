<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

/**
 * Politique de tâche - CollabSearch
 * 
 * Définit les autorisations d'accès aux tâches.
 */
class TaskPolicy
{
    /**
     * Vérifier si l'utilisateur peut voir la tâche
     */
    public function view(User $user, Task $task): bool
    {
        return $user->hasRole('administrator')
            || $task->project->lead_id === $user->id
            || $task->project->hasMember($user)
            || $task->assignee_id === $user->id
            || $user->hasRole('institution');
    }

    /**
     * Vérifier si l'utilisateur peut créer une tâche
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['administrator', 'team_lead', 'researcher']);
    }

    /**
     * Vérifier si l'utilisateur peut mettre à jour la tâche
     */
    public function update(User $user, Task $task): bool
    {
        return $user->hasRole('administrator')
            || $task->project->lead_id === $user->id
            || $task->assignee_id === $user->id;
    }

    /**
     * Vérifier si l'utilisateur peut supprimer la tâche
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->hasRole('administrator')
            || $task->project->lead_id === $user->id;
    }
}
