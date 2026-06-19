<?php

namespace App\Repositories;

use App\Enums\TaskStatus;
use App\Models\Task;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Dépôt de tâches - CollabSearch
 * 
 * Implémentation du dépôt pour les opérations de données
 * liées aux tâches de projet.
 */
class TaskRepository implements TaskRepositoryInterface
{
    /**
     * Récupérer les tâches d'un projet avec filtres
     */
    public function findByProject(int $projectId, ?string $status = null, ?string $priority = null, ?int $assigneeId = null, int $perPage = 50): LengthAwarePaginator
    {
        $query = Task::with(['assignee', 'milestone'])
            ->where('project_id', $projectId);

        if ($status) {
            $query->where('status', $status);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        if ($assigneeId) {
            $query->where('assignee_id', $assigneeId);
        }

        return $query->orderBy('priority', 'desc')
            ->orderBy('due_date', 'asc')
            ->paginate($perPage);
    }

    /**
     * Trouver une tâche par son ID
     */
    public function findById(int $id): ?Task
    {
        return Task::with(['assignee', 'milestone', 'comments.user', 'attachments'])
            ->find($id);
    }

    /**
     * Créer une nouvelle tâche
     */
    public function create(array $data): Task
    {
        return DB::transaction(function () use ($data) {
            return Task::create([
                ...$data,
                'status' => TaskStatus::TODO,
            ]);
        });
    }

    /**
     * Mettre à jour une tâche
     */
    public function update(Task $task, array $data): Task
    {
        $task->update($data);
        return $task->fresh();
    }

    /**
     * Supprimer une tâche
     */
    public function delete(Task $task): bool
    {
        return $task->delete();
    }

    /**
     * Récupérer les données du tableau Kanban
     */
    public function getKanbanData(int $projectId): array
    {
        $tasks = Task::with(['assignee', 'milestone'])
            ->where('project_id', $projectId)
            ->get();

        return [
            'todo'        => $tasks->filter(fn ($task) => $task->status === TaskStatus::TODO)->values(),
            'in_progress' => $tasks->filter(fn ($task) => $task->status === TaskStatus::IN_PROGRESS)->values(),
            'submitted'   => $tasks->filter(fn ($task) => $task->status === TaskStatus::SUBMITTED)->values(),
            'validated'   => $tasks->filter(fn ($task) => $task->status === TaskStatus::VALIDATED)->values(),
            'refused'     => $tasks->filter(fn ($task) => $task->status === TaskStatus::REFUSED)->values(),
        ];
    }

    /**
     * Récupérer les tâches en retard
     */
    public function getOverdueTasks(int $projectId): \Illuminate\Database\Eloquent\Collection
    {
        return Task::where('project_id', $projectId)
            ->whereNotIn('status', [TaskStatus::SUBMITTED->value, TaskStatus::VALIDATED->value, TaskStatus::REFUSED->value])
            ->where('due_date', '<', now())
            ->with('assignee')
            ->get();
    }

    /**
     * Compter les tâches par statut
     */
    public function getTasksByStatus(int $projectId): array
    {
        return Task::where('project_id', $projectId)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }
}
