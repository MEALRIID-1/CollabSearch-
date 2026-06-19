<?php

namespace App\Repositories;

use App\Models\Publication;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Interface du dépôt de publications - CollabSearch
 */
interface PublicationRepositoryInterface
{
    public function search(?string $query = null, ?string $type = null, ?int $year = null, ?int $projectId = null, int $perPage = 15): LengthAwarePaginator;

    public function findById(int $id): ?Publication;

    public function create(array $data): Publication;

    public function update(Publication $publication, array $data): Publication;

    public function delete(Publication $publication): bool;

    public function getByProject(int $projectId): \Illuminate\Database\Eloquent\Collection;

    public function getRecentPublications(int $limit = 10): \Illuminate\Database\Eloquent\Collection;
}
