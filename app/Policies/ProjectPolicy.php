<?php

namespace App\Policies;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;

/**
 * Politique de projet - CollabSearch
 * 
 * Définit les autorisations d'accès aux projets de recherche.
 */
class ProjectPolicy
{
    /**
     * Vérifier si l'utilisateur peut voir le projet
     */
    public function view(User $user, Project $project): bool
    {
        // Tous les utilisateurs authentifiés peuvent voir tous les projets.
        return true;
    }

    /**
     * Vérifier si l'utilisateur peut créer un projet
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['administrator', 'team_lead', 'researcher']);
    }

    /**
     * Vérifier si l'utilisateur peut mettre à jour le projet
     */
    public function update(User $user, Project $project): bool
    {
        return $user->hasRole('administrator')
            || $project->lead_id === $user->id
            || ($project->hasMember($user) && $user->hasRole('team_lead'));
    }

    /**
     * Vérifier si l'utilisateur peut supprimer le projet
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->hasRole('administrator')
            || $project->lead_id === $user->id;
    }

    /**
     * Vérifier si l'utilisateur peut approuver/rejeter le projet
     */
    public function approve(User $user, Project $project): bool
    {
        return $user->hasRole('administrator')
            || $user->hasRole('institution');
    }
}
