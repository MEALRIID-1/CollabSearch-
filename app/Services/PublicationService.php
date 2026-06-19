<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Publication;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Service de gestion des publications - CollabSearch
 * 
 * Gère les opérations métier liées aux publications scientifiques :
 * CRUD, recherche, export BibTeX/APA.
 */
class PublicationService
{
    /**
     * Rechercher des publications
     */
    public function search(?string $query = null, ?string $type = null, ?int $year = null, ?int $projectId = null, int $perPage = 15)
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
     * Créer une nouvelle publication
     */
    public function create(User $user, array $data): Publication
    {
        return DB::transaction(function () use ($user, $data) {
            $publication = Publication::create([
                ...$data,
                'created_by' => $user->id,
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'project_id' => $publication->project_id,
                'action' => ActivityLog::ACTION_CREATE,
                'description' => "Publication '{$publication->title}' créée",
                'subject_type' => Publication::class,
                'subject_id' => $publication->id,
            ]);

            return $publication->load(['project', 'creator']);
        });
    }

    /**
     * Mettre à jour une publication
     */
    public function update(Publication $publication, array $data): Publication
    {
        DB::transaction(function () use ($publication, $data) {
            $publication->update($data);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $publication->project_id,
                'action' => ActivityLog::ACTION_UPDATE,
                'description' => "Publication '{$publication->title}' mise à jour",
                'subject_type' => Publication::class,
                'subject_id' => $publication->id,
            ]);
        });

        return $publication->fresh();
    }

    /**
     * Supprimer une publication
     */
    public function delete(Publication $publication): void
    {
        DB::transaction(function () use ($publication) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $publication->project_id,
                'action' => ActivityLog::ACTION_DELETE,
                'description' => "Publication '{$publication->title}' supprimée",
            ]);

            $publication->delete();
        });
    }

    /**
     * Exporter les publications au format BibTeX
     */
    public function exportBibtex(?int $projectId = null, ?string $type = null): string
    {
        $publications = Publication::when($projectId, fn ($q) => $q->where('project_id', $projectId))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->get();

        $bibtexEntries = $publications->map(fn ($p) => $p->bibtex_citation);

        return $bibtexEntries->implode("\n\n");
    }

    /**
     * Exporter les publications au format APA
     */
    public function exportApa(?int $projectId = null, ?string $type = null): string
    {
        $publications = Publication::when($projectId, fn ($q) => $q->where('project_id', $projectId))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->get();

        return $publications->map(fn ($p) => $p->apa_citation)->implode("\n\n");
    }
}
