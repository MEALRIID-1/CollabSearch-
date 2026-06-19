<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectStatusChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Service de gestion des projets - CollabSearch
 * 
 * Gère les opérations métier liées aux projets de recherche :
 * création, mise à jour, workflow de validation, gestion des membres.
 */
class ProjectService
{
    /**
     * Récupérer les projets de l'utilisateur
     */
    public function getUserProjects(User $user, ?string $status = null, ?string $search = null, int $perPage = 15)
    {
        // Tous les utilisateurs authentifiés voient tous les projets.
        // L'admin voit tout ; les autres voient tous les projets du système.
        $query = Project::with(['lead', 'members'])
            ->withCount('tasks');

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('updated_at', 'desc')->paginate($perPage);
    }

    /**
     * Créer un nouveau projet
     */
    public function createProject(User $user, array $data): Project
    {
        return DB::transaction(function () use ($user, $data) {
            $project = Project::create([
                ...$data,
                'lead_id' => $user->id,
                'status' => ProjectStatus::DRAFT,
                'reference' => $this->generateReference(),
            ]);

            // Ajouter le créateur comme membre avec le rôle lead
            $project->members()->attach($user->id, [
                'role' => 'lead',
                'joined_at' => now(),
            ]);

            // Ajouter les membres supplémentaires
            if (isset($data['member_ids'])) {
                foreach ($data['member_ids'] as $memberId) {
                    if ($memberId !== $user->id) {
                        $project->members()->attach($memberId, [
                            'role' => 'member',
                            'joined_at' => now(),
                        ]);
                    }
                }
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_CREATE,
                'description' => "Projet '{$project->title}' créé",
                'subject_type' => Project::class,
                'subject_id' => $project->id,
            ]);

            return $project->load(['lead', 'members']);
        });
    }

    /**
     * Mettre à jour un projet
     */
    public function updateProject(Project $project, array $data): Project
    {
        DB::transaction(function () use ($project, $data) {
            $project->update($data);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_UPDATE,
                'description' => "Projet '{$project->title}' mis à jour",
                'subject_type' => Project::class,
                'subject_id' => $project->id,
            ]);
        });

        return $project->fresh();
    }

    /**
     * Supprimer un projet
     */
    public function deleteProject(Project $project): void
    {
        DB::transaction(function () use ($project) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_DELETE,
                'description' => "Projet '{$project->title}' supprimé",
            ]);

            $project->delete();
        });
    }

    /**
     * Changer le statut d'un projet
     */
    public function changeStatus(Project $project, ProjectStatus $newStatus, User $user): Project
    {
        if (!$project->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException(
                "Transition de '{$project->status->label()}' vers '{$newStatus->label()}' non autorisée."
            );
        }

        $oldStatus = $project->status;

        DB::transaction(function () use ($project, $newStatus, $user, $oldStatus) {
            $project->update(['status' => $newStatus]);

            // Si le projet passe en actif, définir la date de début
            if ($newStatus === ProjectStatus::ACTIVE && !$project->start_date) {
                $project->update(['start_date' => now()]);
            }

            // Notifier les membres du changement de statut
            foreach ($project->members as $member) {
                if ($member->id !== $user->id) {
                    $member->notify(new ProjectStatusChanged($project, $oldStatus, $newStatus, $user));
                }
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_STATUS_CHANGE,
                'description' => "Statut du projet changé de '{$oldStatus->label()}' à '{$newStatus->label()}'",
                'subject_type' => Project::class,
                'subject_id' => $project->id,
                'properties' => [
                    'old_status' => $oldStatus->value,
                    'new_status' => $newStatus->value,
                ],
            ]);
        });

        return $project->fresh();
    }

    /**
     * Ajouter un membre au projet
     */
    public function addMember(Project $project, int $userId, string $role = 'member'): void
    {
        DB::transaction(function () use ($project, $userId, $role) {
            $project->members()->syncWithoutDetaching([
                $userId => [
                    'role' => $role,
                    'joined_at' => now(),
                ],
            ]);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_ASSIGN,
                'description' => "Membre (ID: {$userId}) ajouté au projet avec le rôle '{$role}'",
            ]);
        });
    }

    /**
     * Retirer un membre du projet
     */
    public function removeMember(Project $project, int $userId): void
    {
        DB::transaction(function () use ($project, $userId) {
            $project->members()->detach($userId);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_UPDATE,
                'description' => "Membre (ID: {$userId}) retiré du projet",
            ]);
        });
    }

    /**
     * Générer une référence unique pour le projet
     */
    private function generateReference(): string
    {
        $prefix = 'CSH';
        $year = now()->year;
        $random = strtoupper(Str::random(6));

        return "{$prefix}-{$year}-{$random}";
    }
}
