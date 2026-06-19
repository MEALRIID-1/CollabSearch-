<?php

namespace App\Repositories;

use App\Models\Publication;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Dépôt de publications - CollabSearch
 * 
 * Implémentation du dépôt pour les opérations de données
 * liées aux publications scientifiques.
 */
class PublicationRepository implements PublicationRepositoryInterface
{
    /**
     * Rechercher des publications
     */
    public function search(?string $query = null, ?string $type = null, ?int $year = null, ?int $projectId = null, int $perPage = 15): LengthAwarePaginator
    {
        $q = Publication::with(['project', 'creator']);

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('abstract', 'like', "%{$query}%")
                  ->orWhereJsonContains('authors', $query)
                  ->orWhereJsonContains('keywords', $query);
            });
        }

        if ($type) {
            $q->where('type', $type);
        }

        if ($year) {
            $q->where('year', $year);
        }

        if ($projectId) {
            $q->where('project_id', $projectId);
        }

        return $q->orderBy('year', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Trouver une publication par son ID
     */
    public function findById(int $id): ?Publication
    {
        return Publication::with(['project', 'creator', 'coAuthors'])
            ->find($id);
    }

    /**
     * Créer une nouvelle publication
     */
    public function create(array $data): Publication
    {
        return DB::transaction(function () use ($data) {
            return Publication::create($data);
        });
    }

    /**
     * Mettre à jour une publication
     */
    public function update(Publication $publication, array $data): Publication
    {
        $publication->update($data);
        return $publication->fresh();
    }

    /**
     * Supprimer une publication
     */
    public function delete(Publication $publication): bool
    {
        return $publication->delete();
    }

    /**
     * Récupérer les publications d'un projet
     */
    public function getByProject(int $projectId): \Illuminate\Database\Eloquent\Collection
    {
        return Publication::where('project_id', $projectId)
            ->with('creator')
            ->orderBy('year', 'desc')
            ->get();
    }

    /**
     * Récupérer les publications récentes
     */
    public function getRecentPublications(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Publication::with(['project', 'creator'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
