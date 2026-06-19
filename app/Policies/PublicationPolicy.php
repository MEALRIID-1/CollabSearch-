<?php

namespace App\Policies;

use App\Models\Publication;
use App\Models\User;

/**
 * Politique de publication - CollabSearch
 * 
 * Définit les autorisations d'accès aux publications scientifiques.
 */
class PublicationPolicy
{
    /**
     * Vérifier si l'utilisateur peut voir la publication
     */
    public function view(User $user, Publication $publication): bool
    {
        return true; // Les publications sont visibles par tous les utilisateurs connectés
    }

    /**
     * Vérifier si l'utilisateur peut créer une publication
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['administrator', 'team_lead', 'researcher']);
    }

    /**
     * Vérifier si l'utilisateur peut mettre à jour la publication
     */
    public function update(User $user, Publication $publication): bool
    {
        return $user->hasRole('administrator')
            || $publication->created_by === $user->id;
    }

    /**
     * Vérifier si l'utilisateur peut supprimer la publication
     */
    public function delete(User $user, Publication $publication): bool
    {
        return $user->hasRole('administrator')
            || $publication->created_by === $user->id;
    }

    /**
     * Vérifier si l'utilisateur peut exporter les publications
     */
    public function export(User $user): bool
    {
        return $user->hasAnyRole(['administrator', 'team_lead', 'researcher', 'institution']);
    }
}
