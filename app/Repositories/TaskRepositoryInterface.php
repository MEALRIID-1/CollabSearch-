<?php

namespace App\Repositories;

use App\Models\Task;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Interface du dépôt de tâches - CollabSearch
 */
interface TaskRepositoryInterface
{
    public function findByProject(int $projectId, ?string $status = null, ?string $priority = null, ?int $assigneeId = null, int $perPage = 50): LengthAwarePaginator;

    public function findById(int $id): ?Task;

    public function create(array $data): Task;

    public function update(Task $task, array $data): Task;

    public function delete(Task $task): bool;

    public function getKanbanData(int $projectId): array;

    public function getOverdueTasks(int $projectId): \Illuminate\Database\Eloquent\Collection;

    public function getTasksByStatus(int $projectId): array;
}
