<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Politique de gestion des utilisateurs.
 */
class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Autoriser tous les droits pour l'administrateur.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('administrator')) {
            return true;
        }

        return null;
    }

    /**
     * Voir la liste des utilisateurs.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['administrator', 'team_lead']);
    }

    /**
     * Voir un utilisateur.
     */
    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id || $user->hasAnyRole(['administrator', 'team_lead']);
    }

    /**
     * Mettre à jour un utilisateur.
     */
    public function update(User $user, User $model): bool
    {
        return $user->id === $model->id || $user->hasRole('administrator');
    }

    /**
     * Supprimer un utilisateur.
     */
    public function delete(User $user, User $model): bool
    {
        return $user->hasRole('administrator');
    }
}
