<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Services\StatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Contrôleur des tableaux de bord personnalisés — CollabSearch
 *
 * Chaque rôle (admin, team_lead, researcher, institution) obtient
 * ses propres KPIs et données graphiques via ce contrôleur.
 */
class DashboardController extends Controller
{
    public function __construct(private StatsService $stats) {}

    // ── Admin ────────────────────────────────────────────────────────────────

    public function adminStats(Request $request): JsonResponse
    {
        $admin = $request->user();

        // Pas de cache — les KPIs doivent être toujours à jour
        $data = [
            'kpis'   => $this->stats->getAdminKPIs($admin),
            'health' => $this->stats->getHealthScore($admin),
        ];

        return response()->json($data);
    }

    // ── Team Lead ─────────────────────────────────────────────────────────────

    public function teamLeadStats(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'kpis'       => $this->stats->getTeamLeadKPIs($user),
            'workload'   => $this->stats->getWorkloadByMember($user),
            'milestones' => $this->stats->getMilestones($user),
        ];

        return response()->json($data);
    }

    // ── Researcher ────────────────────────────────────────────────────────────

    public function researcherStats(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'kpis'         => $this->stats->getResearcherKPIs($user),
            'weekly_tasks' => $this->stats->getResearcherWeeklyTasks($user),
        ];

        return response()->json($data);
    }

    // ── Institution ───────────────────────────────────────────────────────────

    public function institutionStats(Request $request): JsonResponse
    {
        // Cache court (60s) — données globales moins volatiles
        $data = Cache::store('file')->remember('dashboard_institution', 60, fn () => [
            'kpis'            => $this->stats->getInstitutionKPIs(),
            'publications'    => $this->stats->getPublicationsByDomain(),
            'projects_trend'  => $this->stats->getProjectsTrend(),
            'budget_projects' => $this->stats->getBudgetByProject(null),
        ]);

        return response()->json($data);
    }

    // ── Shared stats endpoints ────────────────────────────────────────────────

    public function productivity(Request $request): JsonResponse
    {
        $admin  = $request->user();
        $period = $request->get('period', 'month');

        $data = $this->stats->getProductivityByUser($admin, $period);

        return response()->json(['data' => $data]);
    }

    public function tasksByStatus(Request $request): JsonResponse
    {
        $admin     = $request->user();
        $projectId = $request->integer('project_id') ?: null;

        $data = $this->stats->getTasksByStatus($projectId, $admin);

        return response()->json(['data' => $data]);
    }

    public function activityHeatmap(Request $request): JsonResponse
    {
        $admin = $request->user();
        $weeks = $request->integer('weeks', 12);

        $data = $this->stats->getActivityHeatmap($admin, $weeks);

        return response()->json(['data' => $data]);
    }

    public function publicationsTrend(Request $request): JsonResponse
    {
        $admin  = $request->user();
        $months = $request->integer('months', 12);

        $data = $this->stats->getPublicationsTrend($admin, $months);

        return response()->json(['data' => $data]);
    }

    public function budgetByProject(Request $request): JsonResponse
    {
        $admin = $request->user();

        $data = $this->stats->getBudgetByProject($admin);

        return response()->json(['data' => $data]);
    }

    public function healthScore(Request $request): JsonResponse
    {
        $admin = $request->user();

        $data = $this->stats->getHealthScore($admin);

        return response()->json($data);
    }

    public function activityFeed(Request $request): JsonResponse
    {
        $admin   = $request->user();
        $filters = $request->only(['user_id', 'action', 'date_from', 'date_to', 'search']);

        $paginator = $this->stats->getActivityFeed($admin, $filters);

        return response()->json([
            'data' => ActivityLogResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }
}
