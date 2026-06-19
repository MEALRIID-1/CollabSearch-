<?php

namespace App\Repositories;

use App\Models\Project;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Dépôt de projets - CollabSearch
 * 
 * Implémentation du dépôt pour les opérations de données
 * liées aux projets de recherche.
 */
class ProjectRepository implements ProjectRepositoryInterface
{
    /**
     * Récupérer les projets d'un utilisateur avec pagination
     */
    public function findByUser(int $userId, ?string $status = null, ?string $search = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Project::with(['lead', 'members'])
            ->where(function ($q) use ($userId) {
                $q->where('lead_id', $userId)
                  ->orWhereHas('members', fn ($q) => $q->where('user_id', $userId));
            });

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('updated_at', 'desc')->paginate($perPage);
    }

    /**
     * Trouver un projet par son ID
     */
    public function findById(int $id): ?Project
    {
        return Project::with(['lead', 'members', 'milestones', 'tasks', 'publications', 'budgetLines'])
            ->find($id);
    }

    /**
     * Créer un nouveau projet
     */
    public function create(array $data): Project
    {
        return DB::transaction(function () use ($data) {
            return Project::create($data);
        });
    }

    /**
     * Mettre à jour un projet
     */
    public function update(Project $project, array $data): Project
    {
        $project->update($data);
        return $project->fresh();
    }

    /**
     * Supprimer un projet
     */
    public function delete(Project $project): bool
    {
        return $project->delete();
    }

    /**
     * Ajouter un membre au projet
     */
    public function addMember(Project $project, int $userId, string $role = 'member'): void
    {
        $project->members()->syncWithoutDetaching([
            $userId => ['role' => $role, 'joined_at' => now()],
        ]);
    }

    /**
     * Retirer un membre du projet
     */
    public function removeMember(Project $project, int $userId): bool
    {
        return (bool) $project->members()->detach($userId);
    }

    /**
     * Compter les projets actifs
     */
    public function getActiveProjectsCount(): int
    {
        return Project::where('status', 'active')->count();
    }

    /**
     * Compter les projets par statut
     */
    public function getProjectsByStatus(): array
    {
        return Project::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }
}
