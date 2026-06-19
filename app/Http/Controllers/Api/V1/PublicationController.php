<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePublicationRequest;
use App\Http\Requests\UpdatePublicationRequest;
use App\Http\Resources\PublicationResource;
use App\Models\Publication;
use App\Services\PublicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Contrôleur des publications - CollabSearch
 * 
 * Gère les publications scientifiques : CRUD, recherche,
 * export (BibTeX, APA) et téléversement de PDF.
 */
class PublicationController extends Controller
{
    public function __construct(
        private readonly PublicationService $publicationService
    ) {}

    /**
     * Liste des publications
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $publications = $this->publicationService->search(
                $request->get('search'),
                $request->get('type'),
                $request->get('year'),
                $request->get('project_id'),
                $request->get('per_page', 15)
            );

            return response()->json([
                'publications' => PublicationResource::collection($publications),
                'meta' => [
                    'current_page' => $publications->currentPage(),
                    'last_page' => $publications->lastPage(),
                    'total' => $publications->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des publications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer une nouvelle publication
     */
    public function store(StorePublicationRequest $request): JsonResponse
    {
        $this->authorize('create', Publication::class);

        try {
            $data = $request->validated();

            // Stocker le PDF si fourni
            if ($request->hasFile('file') && $request->file('file')->isValid()) {
                $path = $request->file('file')->store('publications', 'public');
                $data['pdf_path'] = $path;
            }
            unset($data['file']);

            $publication = $this->publicationService->create(
                $request->user(),
                $data
            );

            return response()->json([
                'message' => 'Publication créée avec succès.',
                'publication' => new PublicationResource($publication),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la publication.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher les détails d'une publication
     */
    public function show(Publication $publication): JsonResponse
    {
        $this->authorize('view', $publication);

        return response()->json([
            'publication' => new PublicationResource($publication->load(['project', 'creator', 'coAuthors'])),
        ]);
    }

    /**
     * Mettre à jour une publication
     */
    public function update(UpdatePublicationRequest $request, Publication $publication): JsonResponse
    {
        $this->authorize('update', $publication);

        try {
            $data = $request->validated();

            // Stocker le nouveau PDF si fourni
            if ($request->hasFile('file') && $request->file('file')->isValid()) {
                // Supprimer l'ancien PDF si existant
                if ($publication->pdf_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($publication->pdf_path);
                }
                $path = $request->file('file')->store('publications', 'public');
                $data['pdf_path'] = $path;
            }
            unset($data['file']);

            $publication = $this->publicationService->update($publication, $data);

            return response()->json([
                'message' => 'Publication mise à jour avec succès.',
                'publication' => new PublicationResource($publication),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la publication.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer une publication
     */
    public function destroy(Publication $publication): JsonResponse
    {
        $this->authorize('delete', $publication);

        try {
            $this->publicationService->delete($publication);

            return response()->json([
                'message' => 'Publication supprimée avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la publication.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rechercher des publications
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $publications = $this->publicationService->search(
                $request->get('q'),
                $request->get('type'),
                $request->get('year'),
                $request->get('project_id'),
                $request->get('per_page', 15)
            );

            return response()->json([
                'publications' => PublicationResource::collection($publications),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la recherche de publications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter les publications au format BibTeX
     */
    public function exportBibtex(Request $request): JsonResponse
    {
        $this->authorize('export', Publication::class);

        try {
            $bibtex = $this->publicationService->exportBibtex(
                $request->get('project_id'),
                $request->get('type')
            );

            return response()->json([
                'format' => 'bibtex',
                'content' => $bibtex,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'export BibTeX.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter les publications au format APA
     */
    public function exportApa(Request $request): JsonResponse
    {
        $this->authorize('export', Publication::class);

        try {
            $apa = $this->publicationService->exportApa(
                $request->get('project_id'),
                $request->get('type')
            );

            return response()->json([
                'format' => 'apa',
                'content' => $apa,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'export APA.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Téléverser un PDF pour une publication
     */
    public function uploadPdf(Request $request, Publication $publication): JsonResponse
    {
        $this->authorize('update', $publication);

        $request->validate([
            'pdf' => 'required|file|mimes:pdf|max:51200',
        ]);

        try {
            $path = $request->file('pdf')->store("publications/{$publication->id}", 'public');

            // Supprimer l'ancien PDF si existant
            if ($publication->pdf_path) {
                Storage::disk('public')->delete($publication->pdf_path);
            }

            $publication->update(['pdf_path' => $path]);

            return response()->json([
                'message' => 'PDF téléversé avec succès.',
                'pdf_path' => $path,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du téléversement du PDF.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
