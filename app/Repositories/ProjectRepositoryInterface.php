<?php

namespace App\Repositories;

use App\Models\Project;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Interface du dépôt de projets - CollabSearch
 */
interface ProjectRepositoryInterface
{
    public function findByUser(int $userId, ?string $status = null, ?string $search = null, int $perPage = 15): LengthAwarePaginator;

    public function findById(int $id): ?Project;

    public function create(array $data): Project;

    public function update(Project $project, array $data): Project;

    public function delete(Project $project): bool;

    public function addMember(Project $project, int $userId, string $role = 'member'): void;

    public function removeMember(Project $project, int $userId): bool;

    public function getActiveProjectsCount(): int;

    public function getProjectsByStatus(): array;
}
