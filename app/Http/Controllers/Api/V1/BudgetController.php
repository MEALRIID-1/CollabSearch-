<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BudgetLineResource;
use App\Models\Project;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur de budget - CollabSearch
 * 
 * Gère la vue consolidée du budget d'un projet et l'export.
 */
class BudgetController extends Controller
{
    public function __construct(
        private readonly BudgetService $budgetService
    ) {}

    /**
     * Récupérer le budget complet d'un projet
     */
    public function projectBudget(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        try {
            $budget = $this->budgetService->getProjectBudget($project);

            return response()->json([
                'budget' => $budget,
                'budget_lines' => BudgetLineResource::collection($project->budgetLines),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération du budget.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exporter le budget d'un projet
     */
    public function export(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        try {
            $format = $request->get('format', 'json');
            $data = $this->budgetService->exportBudget($project, $format);

            return response()->json([
                'format' => $format,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'export du budget.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
