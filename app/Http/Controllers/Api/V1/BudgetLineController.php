<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBudgetLineRequest;
use App\Http\Requests\UpdateBudgetLineRequest;
use App\Http\Resources\BudgetLineResource;
use App\Models\BudgetLine;
use App\Models\Project;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur des lignes budgétaires - CollabSearch
 * 
 * Gère les lignes budgétaires d'un projet : CRUD,
 * résumé budgétaire et alertes de dépassement.
 */
class BudgetLineController extends Controller
{
    public function __construct(
        private readonly BudgetService $budgetService
    ) {}

    /**
     * Liste des lignes budgétaires d'un projet
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $budgetLines = $project->budgetLines()
            ->when($request->get('category'), fn ($q, $cat) => $q->where('category', $cat))
            ->orderBy('date', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json([
            'budget_lines' => BudgetLineResource::collection($budgetLines),
        ]);
    }

    /**
     * Créer une nouvelle ligne budgétaire
     */
    public function store(StoreBudgetLineRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        try {
            $budgetLine = $this->budgetService->createBudgetLine($project, $request->validated());

            return response()->json([
                'message' => 'Ligne budgétaire créée avec succès.',
                'budget_line' => new BudgetLineResource($budgetLine),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la ligne budgétaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher les détails d'une ligne budgétaire
     */
    public function show(BudgetLine $budgetLine): JsonResponse
    {
        $this->authorize('view', $budgetLine->project);

        return response()->json([
            'budget_line' => new BudgetLineResource($budgetLine),
        ]);
    }

    /**
     * Mettre à jour une ligne budgétaire
     */
    public function update(UpdateBudgetLineRequest $request, BudgetLine $budgetLine): JsonResponse
    {
        $this->authorize('update', $budgetLine->project);

        try {
            $budgetLine = $this->budgetService->updateBudgetLine($budgetLine, $request->validated());

            return response()->json([
                'message' => 'Ligne budgétaire mise à jour avec succès.',
                'budget_line' => new BudgetLineResource($budgetLine),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la ligne budgétaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer une ligne budgétaire
     */
    public function destroy(BudgetLine $budgetLine): JsonResponse
    {
        $this->authorize('delete', $budgetLine->project);

        try {
            $budgetLine->delete();

            return response()->json([
                'message' => 'Ligne budgétaire supprimée avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la ligne budgétaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Résumé budgétaire d'un projet
     */
    public function summary(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        try {
            $summary = $this->budgetService->getBudgetSummary($project);

            return response()->json([
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération du résumé budgétaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Vérifier les alertes budgétaires d'un projet
     */
    public function checkAlert(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        try {
            $alerts = $this->budgetService->checkBudgetAlerts($project);

            return response()->json([
                'has_alerts' => count($alerts) > 0,
                'alerts' => $alerts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la vérification des alertes.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
