<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Publication;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Contrôleur d'administration - CollabSearch
 * 
 * Fournit les fonctionnalités d'administration :
 * tableau de bord, gestion des utilisateurs, statistiques.
 */
class AdminController extends Controller
{
    /**
     * Tableau de bord administrateur
     */
    public function dashboard(): JsonResponse
    {
        $this->authorize('access-admin-dashboard');

        try {
            $stats = Cache::store('file')->remember('admin_dashboard_stats', 300, function () {
                return [
                    'utilisateurs' => [
                        'total' => User::count(),
                        'actifs' => User::where('is_active', true)->count(),
                        'inactifs' => User::where('is_active', false)->count(),
                    ],
                    'projets' => [
                        'total' => Project::count(),
                        'actifs' => Project::where('status', 'active')->count(),
                        'en_attente' => Project::where('status', 'submitted')->count(),
                        'approuves' => Project::where('status', 'approved')->count(),
                        'archives' => Project::where('status', 'archived')->count(),
                    ],
                    'publications' => [
                        'total' => Publication::count(),
                        'publiees' => Publication::where('is_published', true)->count(),
                    ],
                    'budget' => [
                        'total_alloue' => Project::sum('budget_allocated'),
                        'total_depense' => Project::sum('budget_used'),
                    ],
                ];
            });

            $recentActivities = ActivityLog::with('user')
                ->latest()
                ->limit(10)
                ->get();

            return response()->json([
                'stats' => $stats,
                'recent_activities' => $recentActivities,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération du tableau de bord.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Liste des utilisateurs pour l'administration
     */
    public function users(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        try {
            $users = User::with('roles')
                ->when($request->get('search'), function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                    });
                })
                ->when($request->get('role'), function ($query, $role) {
                    $query->role($role);
                })
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 25));

            return response()->json([
                'users' => UserResource::collection($users),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des utilisateurs.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques détaillées
     */
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('access-admin-dashboard');

        try {
            $period = $request->get('period', 'month');

            $stats = Cache::store('file')->remember("admin_stats_{$period}", 300, function () use ($period) {
                $startDate = match ($period) {
                    'week' => now()->subWeek(),
                    'month' => now()->subMonth(),
                    'year' => now()->subYear(),
                    default => now()->subMonth(),
                };

                return [
                    'nouveaux_utilisateurs' => User::where('created_at', '>=', $startDate)->count(),
                    'nouveaux_projets' => Project::where('created_at', '>=', $startDate)->count(),
                    'nouvelles_publications' => Publication::where('created_at', '>=', $startDate)->count(),
                    'projets_par_statut' => Project::select('status', DB::raw('count(*) as count'))
                        ->groupBy('status')
                        ->pluck('count', 'status')
                        ->toArray(),
                    'utilisateurs_par_role' => DB::table('model_has_roles')
                        ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                        ->select('roles.name', DB::raw('count(*) as count'))
                        ->groupBy('roles.name')
                        ->pluck('count', 'name')
                        ->toArray(),
                    'publications_par_type' => Publication::select('type', DB::raw('count(*) as count'))
                        ->groupBy('type')
                        ->pluck('count', 'type')
                        ->toArray(),
                ];
            });

            return response()->json([
                'period' => $period,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des statistiques.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
