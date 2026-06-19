<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\MilestoneResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur de projets - CollabSearch
 * 
 * Gère les opérations CRUD sur les projets de recherche ainsi que
 * le workflow de validation et la gestion des membres et jalons.
 */
class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectService $projectService
    ) {}

    /**
     * Liste des projets de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $projects = $this->projectService->getUserProjects(
                $request->user(),
                $request->get('status'),
                $request->get('search'),
                $request->get('per_page', 15)
            );

            return response()->json([
                'projects' => ProjectResource::collection($projects),
                'meta' => [
                    'current_page' => $projects->currentPage(),
                    'last_page' => $projects->lastPage(),
                    'per_page' => $projects->perPage(),
                    'total' => $projects->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des projets.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer un nouveau projet
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        try {
            $project = $this->projectService->createProject(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'message' => 'Projet créé avec succès.',
                'project' => new ProjectResource($project),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher les détails d'un projet
     */
    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json([
            'project' => new ProjectResource($project->loadCount('tasks')->load(['lead', 'members', 'milestones', 'tasks', 'publications', 'budgetLines'])),
        ]);
    }

    /**
     * Mettre à jour un projet
     */
    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        try {
            $project = $this->projectService->updateProject($project, $request->validated());

            return response()->json([
                'message' => 'Projet mis à jour avec succès.',
                'project' => new ProjectResource($project),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un projet
     */
    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        try {
            $this->projectService->deleteProject($project);

            return response()->json([
                'message' => 'Projet supprimé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soumettre le projet pour approbation
     */
    public function submit(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        try {
            $project = $this->projectService->changeStatus($project, ProjectStatus::SUBMITTED, $request->user());

            return response()->json([
                'message' => 'Projet soumis pour approbation.',
                'project' => new ProjectResource($project),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la soumission du projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approuver un projet
     */
    public function approve(Request $request, Project $project): JsonResponse
    {
        $this->authorize('approve', $project);

        try {
            $project = $this->projectService->changeStatus($project, ProjectStatus::APPROVED, $request->user());

            return response()->json([
                'message' => 'Projet approuvé avec succès.',
                'project' => new ProjectResource($project),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'approbation du projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rejeter un projet
     */
    public function reject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('approve', $project);

        try {
            $project = $this->projectService->changeStatus($project, ProjectStatus::REJECTED, $request->user());

            return response()->json([
                'message' => 'Projet rejeté.',
                'project' => new ProjectResource($project),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du rejet du projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Archiver un projet
     */
    public function archive(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        try {
            $project = $this->projectService->changeStatus($project, ProjectStatus::ARCHIVED, $request->user());

            return response()->json([
                'message' => 'Projet archivé avec succès.',
                'project' => new ProjectResource($project),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'archivage du projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ajouter un membre au projet
     */
    public function addMember(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'sometimes|in:lead,member,observer',
        ]);

        // Vérifier que l'utilisateur cible est géré par cet admin
        $auth = $request->user();
        if ($auth->hasRole('administrator')) {
            $targetUser = \App\Models\User::find($request->get('user_id'));
            if ($targetUser && $targetUser->id !== $auth->id && !$targetUser->isManagedBy($auth->id)) {
                return response()->json([
                    'message' => 'Cet utilisateur ne fait pas partie de votre espace.',
                ], 403);
            }
        }

        try {
            $this->projectService->addMember(
                $project,
                $request->get('user_id'),
                $request->get('role', 'member')
            );

            return response()->json([
                'message' => 'Membre ajouté au projet avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'ajout du membre.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retirer un membre du projet
     */
    public function removeMember(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        try {
            $this->projectService->removeMember($project, $request->get('user_id'));

            return response()->json([
                'message' => 'Membre retiré du projet avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du retrait du membre.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lister les jalons d'un projet
     */
    public function milestones(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json([
            'milestones' => MilestoneResource::collection($project->milestones),
        ]);
    }

    /**
     * Créer un jalon pour un projet
     */
    public function storeMilestone(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
        ]);

        try {
            $milestone = $project->milestones()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? '',
                'due_date' => $validated['due_date'],
            ]);

            return response()->json([
                'message' => 'Jalon créé avec succès.',
                'milestone' => new MilestoneResource($milestone),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du jalon.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
