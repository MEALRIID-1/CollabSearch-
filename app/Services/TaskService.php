<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskReviewed;
use Illuminate\Support\Facades\DB;

/**
 * Service de gestion des tâches - CollabSearch
 *
 * Gère les opérations métier liées aux tâches :
 * CRUD, Kanban, commentaires, assignation et validation.
 */
class TaskService
{
    /**
     * Récupérer les tâches d'un projet avec filtres
     */
    public function getProjectTasks(Project $project, ?string $status = null, ?string $priority = null, ?int $assigneeId = null, int $perPage = 50)
    {
        $query = Task::with(['assignee', 'milestone'])
            ->where('project_id', $project->id);

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
     * Récupérer les données du tableau Kanban
     */
    public function getKanbanData(Project $project): array
    {
        $tasks = Task::with(['assignee', 'milestone', 'attachments'])
            ->where('project_id', $project->id)
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
     * Créer une nouvelle tâche
     */
    public function createTask(Project $project, User $user, array $data): Task
    {
        return DB::transaction(function () use ($project, $user, $data) {
            $task = Task::create([
                ...$data,
                'project_id' => $project->id,
                'status' => TaskStatus::TODO,
            ]);

            // Notifier l'utilisateur assigné (silencieux si serveur mail indisponible)
            if ($task->assignee_id && $task->assignee_id !== $user->id) {
                try {
                    $assignee = User::find($task->assignee_id);
                    $assignee?->notify(new TaskAssigned($task, $user));
                } catch (\Throwable) {
                    // Notification ignorée si le serveur mail est inaccessible
                }
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_CREATE,
                'description' => "Tâche '{$task->title}' créée",
                'subject_type' => Task::class,
                'subject_id' => $task->id,
            ]);

            return $task->load(['assignee', 'milestone']);
        });
    }

    /**
     * Mettre à jour une tâche
     */
    public function updateTask(Task $task, array $data): Task
    {
        DB::transaction(function () use ($task, $data) {
            $task->update($data);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $task->project_id,
                'action' => ActivityLog::ACTION_UPDATE,
                'description' => "Tâche '{$task->title}' mise à jour",
                'subject_type' => Task::class,
                'subject_id' => $task->id,
            ]);
        });

        return $task->fresh();
    }


    /**
     * Mettre à jour le statut d'une tâche
     */
    public function updateStatus(Task $task, array $data, User $user): Task
    {
        $newStatus = TaskStatus::from($data['status']);

        if (!$task->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException(
                "Transition de '{$task->status->label()}' vers '{$newStatus->label()}' non autorisée."
            );
        }

        DB::transaction(function () use ($task, $newStatus, $user) {
            $updateData = ['status' => $newStatus];

            if ($newStatus === TaskStatus::SUBMITTED) {
                $updateData['completed_at'] = now();
            }

            if ($newStatus === TaskStatus::TODO || $newStatus === TaskStatus::IN_PROGRESS) {
                $updateData['completed_at'] = null;
                $updateData['validated_at'] = null;
                $updateData['validated_by'] = null;
            }

            $task->update($updateData);

            ActivityLog::create([
                'user_id' => $user->id,
                'project_id' => $task->project_id,
                'action' => ActivityLog::ACTION_STATUS_CHANGE,
                'description' => "Statut de la tâche '{$task->title}' changé vers '{$newStatus->label()}'",
                'subject_type' => Task::class,
                'subject_id' => $task->id,
            ]);
        });

        return $task->fresh();
    }

    /**
     * Assigner une tâche à un utilisateur
     */
    public function assignTask(Task $task, int $assigneeId, User $assignedBy): Task
    {
        DB::transaction(function () use ($task, $assigneeId, $assignedBy) {
            $task->update(['assignee_id' => $assigneeId]);

            $assignee = User::find($assigneeId);
            try {
                $assignee?->notify(new TaskAssigned($task, $assignedBy));
            } catch (\Throwable) {
                // Notification ignorée si le serveur mail est inaccessible
            }

            ActivityLog::create([
                'user_id' => $assignedBy->id,
                'project_id' => $task->project_id,
                'action' => ActivityLog::ACTION_ASSIGN,
                'description' => "Tâche '{$task->title}' assignée à {$assignee?->full_name}",
                'subject_type' => Task::class,
                'subject_id' => $task->id,
            ]);
        });

        return $task->fresh();
    }

    /**
     * Valider une tâche soumise
     */
    public function validateTask(Task $task, User $validator): Task
    {
        if ($task->status !== TaskStatus::SUBMITTED) {
            throw new \InvalidArgumentException(
                'Seule une tâche soumise peut être validée.'
            );
        }

        DB::transaction(function () use ($task, $validator) {
            $task->update([
                'status' => TaskStatus::VALIDATED,
                'validated_at' => now(),
                'validated_by' => $validator->id,
            ]);
            // L'observer TaskObserver::updated() détecte le changement de statut
            // et synchronise automatiquement le jalon (auto-complétion si tout est validé)

            // Notifier l'assigné
            if ($task->assignee_id) {
                try {
                    $assignee = User::find($task->assignee_id);
                    $assignee?->notify(new TaskReviewed($task, $validator, true));
                } catch (\Throwable) {}
            }

            ActivityLog::create([
                'user_id' => $validator->id,
                'project_id' => $task->project_id,
                'action' => ActivityLog::ACTION_STATUS_CHANGE,
                'description' => "Tache '{$task->title}' validee par {$validator->full_name}",
                'subject_type' => Task::class,
                'subject_id' => $task->id,
            ]);
        });

        return $task->fresh();
    }

    /**
     * Refuser une tâche soumise
     */
    public function refuseTask(Task $task, User $reviewer): Task
    {
        if ($task->status !== TaskStatus::SUBMITTED) {
            throw new \InvalidArgumentException(
                'Seule une tâche soumise peut être refusée.'
            );
        }

        DB::transaction(function () use ($task, $reviewer) {
            $task->update([
                'status' => TaskStatus::REFUSED,
            ]);

            // Notifier l'assigné
            if ($task->assignee_id) {
                try {
                    $assignee = User::find($task->assignee_id);
                    $assignee?->notify(new TaskReviewed($task, $reviewer, false));
                } catch (\Throwable) {}
            }

            ActivityLog::create([
                'user_id' => $reviewer->id,
                'project_id' => $task->project_id,
                'action' => ActivityLog::ACTION_STATUS_CHANGE,
                'description' => "Tâche '{$task->title}' refusée par {$reviewer->full_name}",
                'subject_type' => Task::class,
                'subject_id' => $task->id,
            ]);
        });

        return $task->fresh();
    }

    /**
     * Supprimer une tâche
     */
    public function deleteTask(Task $task): void
    {
        DB::transaction(function () use ($task) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $task->project_id,
                'action' => ActivityLog::ACTION_DELETE,
                'description' => "Tâche '{$task->title}' supprimée",
            ]);

            $task->delete();
        });
    }

    /**
     * Ajouter un commentaire à une tâche
     */
    public function addComment(Task $task, User $user, array $data): TaskComment
    {
        return TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'content' => $data['content'],
        ]);
    }
}
