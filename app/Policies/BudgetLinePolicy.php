<?php

namespace App\Policies;

use App\Models\BudgetLine;
use App\Models\User;

/**
 * Politique de ligne budgétaire - CollabSearch
 * 
 * Définit les autorisations d'accès aux lignes budgétaires.
 */
class BudgetLinePolicy
{
    /**
     * Vérifier si l'utilisateur peut voir la ligne budgétaire
     */
    public function view(User $user, BudgetLine $budgetLine): bool
    {
        return $user->hasRole('administrator')
            || $budgetLine->project->lead_id === $user->id
            || $budgetLine->project->hasMember($user)
            || $user->hasRole('institution');
    }

    /**
     * Vérifier si l'utilisateur peut créer une ligne budgétaire
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['administrator', 'team_lead']);
    }

    /**
     * Vérifier si l'utilisateur peut mettre à jour la ligne budgétaire
     */
    public function update(User $user, BudgetLine $budgetLine): bool
    {
        return $user->hasRole('administrator')
            || $budgetLine->project->lead_id === $user->id;
    }

    /**
     * Vérifier si l'utilisateur peut supprimer la ligne budgétaire
     */
    public function delete(User $user, BudgetLine $budgetLine): bool
    {
        return $user->hasRole('administrator')
            || $budgetLine->project->lead_id === $user->id;
    }
}
