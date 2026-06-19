<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur des rapports - CollabSearch
 * 
 * Génère les rapports de projets, d'équipes et budgétaires.
 */
class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService
    ) {}

    /**
     * Rapport de projet
     */
    public function projectReport(Request $request, int $projectId): JsonResponse
    {
        $this->authorize('view', \App\Models\Project::class);

        try {
            $report = $this->reportService->generateProjectReport(
                $projectId,
                $request->get('format', 'json')
            );

            return response()->json([
                'report' => $report,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la génération du rapport de projet.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rapport d'équipe
     */
    public function teamReport(Request $request): JsonResponse
    {
        $this->authorize('view', \App\Models\Project::class);

        try {
            $report = $this->reportService->generateTeamReport(
                $request->user(),
                $request->get('project_id'),
                $request->get('format', 'json')
            );

            return response()->json([
                'report' => $report,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la génération du rapport d\'équipe.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rapport budgétaire
     */
    public function budgetReport(Request $request, int $projectId): JsonResponse
    {
        $this->authorize('view', \App\Models\Project::class);

        try {
            $report = $this->reportService->generateBudgetReport(
                $projectId,
                $request->get('format', 'json')
            );

            return response()->json([
                'report' => $report,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la génération du rapport budgétaire.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
