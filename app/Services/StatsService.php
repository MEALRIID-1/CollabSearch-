<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\BudgetLine;
use App\Models\Meeting;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatsService
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private function adminScope(User $admin): \Illuminate\Database\Eloquent\Builder
    {
        // Restrict queries to users managed by this admin
        $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
        return User::whereIn('id', $userIds);
    }

    private function projectScope(User $admin): \Illuminate\Database\Eloquent\Builder
    {
        $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
        return Project::where(function ($q) use ($userIds) {
            $q->whereIn('lead_id', $userIds)
              ->orWhereHas('members', fn ($m) => $m->whereIn('users.id', $userIds));
        });
    }

    // ── Admin KPIs ────────────────────────────────────────────────────────────

    public function getAdminKPIs(User $admin): array
    {
        // Périmètre : admin lui-même + tous les utilisateurs qu'il a créés
        $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);

        // Projets où l'un des $userIds est chef ou membre
        $projectIds = Project::where(function ($q) use ($userIds) {
            $q->whereIn('lead_id', $userIds)
              ->orWhereHas('members', fn ($m) => $m->whereIn('users.id', $userIds));
        })->pluck('id');

        $now        = now();
        $startMonth = $now->copy()->startOfMonth();
        $startWeek  = $now->copy()->startOfWeek();

        // Publications scope : par projet OU créées directement par un des users
        $pubQuery = Publication::where(function ($q) use ($projectIds, $userIds) {
            $q->whereIn('project_id', $projectIds)
              ->orWhereIn('created_by', $userIds);
        });

        return [
            'users' => [
                // Inclure l'admin lui-même dans le décompte
                'total'    => User::whereIn('id', $userIds)->count(),
                'active'   => User::whereIn('id', $userIds)->where('is_active', true)->count(),
                'inactive' => User::whereIn('id', $userIds)->where('is_active', false)->count(),
            ],
            'projects' => [
                'total'    => $projectIds->count(),
                // "actifs" = tout sauf draft, archived, rejected
                'active'   => Project::whereIn('id', $projectIds)
                                ->whereNotIn('status', ['draft', 'archived', 'rejected'])
                                ->count(),
                'pending'  => Project::whereIn('id', $projectIds)->where('status', 'submitted')->count(),
                'archived' => Project::whereIn('id', $projectIds)->where('status', 'archived')->count(),
            ],
            'tasks' => [
                // Tâches actives (non terminées) : todo + in_progress + submitted
                'pending'              => Task::whereIn('project_id', $projectIds)->whereIn('status', ['todo', 'in_progress', 'submitted'])->count(),
                'created_this_month'   => Task::whereIn('project_id', $projectIds)->where('created_at', '>=', $startMonth)->count(),
                'completed_this_month' => Task::whereIn('project_id', $projectIds)->where('status', 'validated')->where('updated_at', '>=', $startMonth)->count(),
                'overdue'              => Task::whereIn('project_id', $projectIds)->whereNotIn('status', ['validated', 'refused'])->where('due_date', '<', $now)->whereNotNull('due_date')->count(),
            ],
            'publications' => [
                'total'           => (clone $pubQuery)->count(),
                'submitted_month' => (clone $pubQuery)->where('created_at', '>=', $startMonth)->count(),
            ],
            'budget' => [
                'allocated' => Project::whereIn('id', $projectIds)->sum('budget_allocated'),
                'spent'     => Project::whereIn('id', $projectIds)->sum('budget_used'),
            ],
            'completion_rate' => $this->avgCompletionRate($projectIds),
            'meetings_this_week' => Meeting::whereIn('id', function ($q) use ($userIds) {
                $q->select('meeting_id')->from('meeting_user')->whereIn('user_id', $userIds);
            })->where('scheduled_at', '>=', $startWeek)->count(),
        ];
    }

    // ── Team Lead KPIs ────────────────────────────────────────────────────────

    /**
     * Récupère les IDs de projets du chef d'équipe :
     * projets dont il est lead OU membre (table project_user).
     */
    private function getTeamLeadProjectIds(User $user): \Illuminate\Support\Collection
    {
        return Project::where(function ($q) use ($user) {
            $q->where('lead_id', $user->id)
              ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
        })->pluck('id');
    }

    /**
     * Construit la base de requête pour les tâches visibles d'un chef d'équipe :
     * tâches dans ses projets OU directement assignées à lui.
     */
    private function teamLeadTaskQuery(User $user, \Illuminate\Support\Collection $projectIds): \Illuminate\Database\Eloquent\Builder
    {
        return Task::where(function ($q) use ($projectIds, $user) {
            if ($projectIds->isNotEmpty()) {
                $q->whereIn('project_id', $projectIds->toArray());
            }
            // Filet de sécurité : tâches assignées au chef même sans être dans project_user
            $q->orWhere('assignee_id', $user->id);
        });
    }

    public function getTeamLeadKPIs(User $user): array
    {
        $now        = now();
        $projectIds = $this->getTeamLeadProjectIds($user);

        $taskQuery  = $this->teamLeadTaskQuery($user, $projectIds);

        return [
            'projects_count'       => $projectIds->count(),
            'tasks_to_validate'    => (clone $taskQuery)->where('status', 'submitted')->count(),
            'overdue_tasks'        => (clone $taskQuery)
                                         ->whereNotIn('status', ['validated', 'refused'])
                                         ->where('due_date', '<', $now)
                                         ->whereNotNull('due_date')
                                         ->count(),
            'publications_pending' => $projectIds->isNotEmpty()
                ? Publication::whereIn('project_id', $projectIds->toArray())->count()
                : 0,
            'tasks' => [
                'todo'        => (clone $taskQuery)->where('status', 'todo')->count(),
                'in_progress' => (clone $taskQuery)->where('status', 'in_progress')->count(),
                'submitted'   => (clone $taskQuery)->where('status', 'submitted')->count(),
                'validated'   => (clone $taskQuery)->where('status', 'validated')->count(),
                'refused'     => (clone $taskQuery)->where('status', 'refused')->count(),
            ],
            'next_meeting' => Meeting::where(function ($q) use ($user) {
                $q->where('organizer_id', $user->id)
                  ->orWhereHas('participants', fn ($pq) => $pq->where('users.id', $user->id));
            })->where('scheduled_at', '>', $now)->orderBy('scheduled_at')->first()?->toArray(),
            'budget' => [
                'allocated' => $projectIds->isNotEmpty()
                    ? Project::whereIn('id', $projectIds->toArray())->sum('budget_allocated')
                    : 0,
                'spent'     => $projectIds->isNotEmpty()
                    ? Project::whereIn('id', $projectIds->toArray())->sum('budget_used')
                    : 0,
            ],
        ];
    }

    /**
     * Répartition des tâches par statut pour le chef d'équipe.
     */
    public function getTeamLeadTasksByStatus(User $user): array
    {
        $projectIds = $this->getTeamLeadProjectIds($user);
        $taskQuery  = $this->teamLeadTaskQuery($user, $projectIds);

        $rows = (clone $taskQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $labels = [
            'todo'        => 'À faire',
            'in_progress' => 'En cours',
            'submitted'   => 'Soumis',
            'validated'   => 'Validé',
            'refused'     => 'Refusé',
        ];

        return collect($labels)->map(fn ($label, $key) => [
            'status' => $key,
            'label'  => $label,
            'count'  => $rows[$key] ?? 0,
        ])->values()->toArray();
    }

    // ── Researcher KPIs ───────────────────────────────────────────────────────

    public function getResearcherKPIs(User $user): array
    {
        $now = now();
        $startWeek  = $now->copy()->startOfWeek();

        $myTasks = Task::where('assignee_id', $user->id);

        // Streak: consecutive days with a validated task
        $streak = $this->calculateStreak($user->id);

        $statusLabels = [
            'todo'        => 'À faire',
            'in_progress' => 'En cours',
            'submitted'   => 'Soumise',
            'validated'   => 'Validée',
            'refused'     => 'Refusée',
        ];

        $tasksByStatus = collect(array_keys($statusLabels))->map(fn ($s) => [
            'status' => $s,
            'label'  => $statusLabels[$s],
            'count'  => (clone $myTasks)->where('status', $s)->count(),
        ])->values()->toArray();

        return [
            'tasks' => [
                'total'    => (clone $myTasks)->count(),
                'todo'     => (clone $myTasks)->where('status', 'todo')->count(),
                'in_progress' => (clone $myTasks)->where('status', 'in_progress')->count(),
                'overdue'  => (clone $myTasks)->whereNotIn('status', ['validated', 'refused'])->where('due_date', '<', $now)->whereNotNull('due_date')->count(),
                'completed_this_week' => (clone $myTasks)->where('status', 'validated')->where('updated_at', '>=', $startWeek)->count(),
            ],
            'publications'    => Publication::where('created_by', $user->id)->count(),
            'streak_days'     => $streak,
            'projects_count'  => Project::whereHas('members', fn ($m) => $m->where('users.id', $user->id))->count(),
            'tasks_by_status' => $tasksByStatus,
        ];
    }

    // ── Institution KPIs ──────────────────────────────────────────────────────

    public function getInstitutionKPIs(): array
    {
        return [
            'projects' => [
                'total'    => Project::count(),
                'active'   => Project::where('status', 'active')->count(),
                'pending'  => Project::where('status', 'submitted')->count(),
                'approved' => Project::where('status', 'approved')->count(),
            ],
            'publications_total' => Publication::count(),
            'budget' => [
                'allocated' => Project::sum('budget_allocated'),
                'spent'     => Project::sum('budget_used'),
            ],
            'users_total' => User::where('is_active', true)->count(),
        ];
    }

    // ── Chart data ────────────────────────────────────────────────────────────

    public function getProductivityByUser(User $admin, string $period = 'month'): array
    {
        $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id');
        $since = match ($period) {
            'week'    => now()->subWeek(),
            'quarter' => now()->subQuarter(),
            default   => now()->subMonth(),
        };

        $rows = Task::whereIn('assignee_id', $userIds)
            ->where('status', 'validated')
            ->where('updated_at', '>=', $since)
            ->select('assignee_id', DB::raw('count(*) as total'))
            ->with('assignee:id,first_name,last_name')
            ->groupBy('assignee_id')
            ->get();

        return $rows->map(fn ($r) => [
            'user_id' => $r->assignee_id,
            'name'    => $r->assignee?->full_name ?? "User #{$r->assignee_id}",
            'total'   => $r->total,
        ])->values()->toArray();
    }

    public function getTasksByStatus(?int $projectId = null, ?User $admin = null): array
    {
        $q = Task::query();
        if ($projectId) {
            $q->where('project_id', $projectId);
        } elseif ($admin) {
            $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
            $projectIds = Project::where(function ($qq) use ($userIds) {
                $qq->whereIn('lead_id', $userIds)
                   ->orWhereHas('members', fn ($m) => $m->whereIn('users.id', $userIds));
            })->pluck('id');
            $q->whereIn('project_id', $projectIds);
        }

        $rows = $q->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $labels = [
            'todo'        => 'À faire',
            'in_progress' => 'En cours',
            'submitted'   => 'Soumis',
            'validated'   => 'Validé',
            'refused'     => 'Refusé',
        ];

        return collect($labels)->map(fn ($label, $key) => [
            'status' => $key,
            'label'  => $label,
            'count'  => $rows[$key] ?? 0,
        ])->values()->toArray();
    }

    public function getActivityHeatmap(?User $admin, int $weeks = 12): array
    {
        $since = now()->subWeeks($weeks)->startOfDay();
        $q = ActivityLog::where('created_at', '>=', $since);
        if ($admin) {
            $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
            $q->whereIn('user_id', $userIds);
        }

        $rows = $q->select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('count(*) as count')
            )
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return $rows->map(fn ($r) => [
            'date'  => $r->day,
            'count' => $r->count,
        ])->toArray();
    }

    public function getPublicationsTrend(?User $admin, int $months = 12): array
    {
        $since = now()->subMonths($months)->startOfMonth();
        $q = Publication::where('created_at', '>=', $since);
        if ($admin) {
            $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
            $q->whereIn('created_by', $userIds);
        }

        $rows = $q->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('count(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return $rows->map(fn ($r) => [
            'month' => $r->month,
            'count' => $r->count,
        ])->toArray();
    }

    public function getBudgetByProject(?User $admin): array
    {
        $q = Project::whereIn('status', ['active', 'approved', 'archived']);
        if ($admin) {
            $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
            $q->where(function ($qq) use ($userIds) {
                $qq->whereIn('lead_id', $userIds)
                   ->orWhereHas('members', fn ($m) => $m->whereIn('users.id', $userIds));
            });
        }

        return $q->get(['id', 'title', 'budget_allocated', 'budget_used'])
            ->map(fn ($p) => [
                'id'        => $p->id,
                'title'     => $p->title,
                'allocated' => (float) $p->budget_allocated,
                'spent'     => (float) $p->budget_used,
                'over'      => max(0, (float) $p->budget_used - (float) $p->budget_allocated),
            ])
            ->values()
            ->toArray();
    }

    public function getHealthScore(User $admin): array
    {
        $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
        $projectIds = Project::where(function ($q) use ($userIds) {
            $q->whereIn('lead_id', $userIds)
              ->orWhereHas('members', fn ($m) => $m->whereIn('users.id', $userIds));
        })->pluck('id');

        $totalTasks     = Task::whereIn('project_id', $projectIds)->count() ?: 1;
        $validatedTasks = Task::whereIn('project_id', $projectIds)->where('status', 'validated')->count();
        $overdueTasks   = Task::whereIn('project_id', $projectIds)
            ->whereNotIn('status', ['validated', 'refused'])
            ->where('due_date', '<', now())
            ->whereNotNull('due_date')
            ->count();
        $onTimeTasks = $validatedTasks - $overdueTasks;

        $totalPubs     = Publication::whereIn('project_id', $projectIds)->count() ?: 1;

        $totalBudget = (float) Project::whereIn('id', $projectIds)->sum('budget_allocated') ?: 1;
        $usedBudget  = (float) Project::whereIn('id', $projectIds)->sum('budget_used');

        $rateOnTime   = min(100, max(0, ($onTimeTasks / $totalTasks) * 100));
        $rateBudget   = min(100, max(0, (1 - $usedBudget / $totalBudget) * 100));
        $ratePubs     = min(100, ($validatedTasks / $totalTasks) * 100);

        $score = round(
            $rateOnTime  * 0.40 +
            $rateBudget  * 0.30 +
            $ratePubs    * 0.30
        );

        return [
            'score'          => $score,
            'on_time_rate'   => round($rateOnTime),
            'budget_rate'    => round($rateBudget),
            'pub_rate'       => round($ratePubs),
        ];
    }

    public function getWorkloadByMember(User $teamLead): array
    {
        $projectIds = $this->getTeamLeadProjectIds($teamLead);

        $memberIds = DB::table('project_user')
            ->whereIn('project_id', $projectIds)
            ->pluck('user_id')
            ->unique();

        return User::whereIn('id', $memberIds)
            ->get(['id', 'first_name', 'last_name'])
            ->map(function ($u) use ($projectIds) {
                return [
                    'name'      => $u->full_name,
                    'assigned'  => Task::where('assignee_id', $u->id)->whereIn('project_id', $projectIds)->count(),
                    'completed' => Task::where('assignee_id', $u->id)->whereIn('project_id', $projectIds)->where('status', 'validated')->count(),
                ];
            })
            ->values()
            ->toArray();
    }

    public function getMilestones(User $teamLead, int $days = 30): array
    {
        $projectIds = $this->getTeamLeadProjectIds($teamLead);

        return Milestone::whereIn('project_id', $projectIds)
            ->where('due_date', '>=', now())
            ->where('due_date', '<=', now()->addDays($days))
            ->with('project:id,title')
            ->orderBy('due_date')
            ->get()
            ->map(fn ($m) => [
                'id'      => $m->id,
                'title'   => $m->title,
                'project' => $m->project?->title,
                'due'     => $m->due_date,
                'done'    => $m->completed,
            ])
            ->toArray();
    }

    public function getResearcherWeeklyTasks(User $user, int $weeks = 8): array
    {
        $since = now()->subWeeks($weeks)->startOfWeek();

        return Task::where('assignee_id', $user->id)
            ->where('status', 'validated')
            ->where('updated_at', '>=', $since)
            ->select(
                DB::raw('YEARWEEK(updated_at, 1) as week_key'),
                DB::raw('MIN(DATE(updated_at)) as week_start'),
                DB::raw('count(*) as count')
            )
            ->groupBy('week_key')
            ->orderBy('week_key')
            ->get()
            ->map(fn ($r) => [
                'week'  => $r->week_start,
                'count' => $r->count,
            ])
            ->toArray();
    }

    public function getPublicationsByDomain(): array
    {
        return Publication::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->map(fn ($count, $type) => ['type' => $type, 'count' => $count])
            ->values()
            ->toArray();
    }

    public function getProjectsTrend(int $months = 24): array
    {
        $since = now()->subMonths($months)->startOfMonth();

        $submitted = Project::where('created_at', '>=', $since)
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('count(*) as count'))
            ->groupBy('month')->orderBy('month')->pluck('count', 'month');

        $approved = Project::where('status', 'approved')
            ->where('updated_at', '>=', $since)
            ->select(DB::raw("DATE_FORMAT(updated_at, '%Y-%m') as month"), DB::raw('count(*) as count'))
            ->groupBy('month')->orderBy('month')->pluck('count', 'month');

        $months_list = collect();
        $cursor = now()->subMonths($months)->startOfMonth();
        while ($cursor <= now()) {
            $months_list->push($cursor->format('Y-m'));
            $cursor->addMonth();
        }

        return $months_list->map(fn ($m) => [
            'month'     => $m,
            'submitted' => $submitted[$m] ?? 0,
            'approved'  => $approved[$m] ?? 0,
        ])->values()->toArray();
    }

    public function getActivityFeed(?User $admin, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $q = ActivityLog::with('user:id,first_name,last_name,avatar');

        if ($admin) {
            $userIds = User::where('created_by_admin_id', $admin->id)->pluck('id')->push($admin->id);
            $q->whereIn('user_id', $userIds);
        }

        if (!empty($filters['user_id'])) {
            $q->where('user_id', $filters['user_id']);
        }
        if (!empty($filters['action'])) {
            $q->where('action', $filters['action']);
        }
        if (!empty($filters['date_from'])) {
            $q->where('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $q->where('created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if (!empty($filters['search'])) {
            $q->where('description', 'like', '%' . $filters['search'] . '%');
        }

        return $q->latest()->paginate(20);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function avgCompletionRate(\Illuminate\Support\Collection $projectIds): float
    {
        if ($projectIds->isEmpty()) return 0;
        $total = Task::whereIn('project_id', $projectIds)->count() ?: 1;
        $done  = Task::whereIn('project_id', $projectIds)->where('status', 'validated')->count();
        return round(($done / $total) * 100, 1);
    }

    private function calculateStreak(int $userId): int
    {
        $days = Task::where('assignee_id', $userId)
            ->where('status', 'validated')
            ->where('updated_at', '>=', now()->subDays(365))
            ->select(DB::raw('DATE(updated_at) as day'))
            ->distinct()
            ->orderBy('day', 'desc')
            ->pluck('day')
            ->map(fn ($d) => \Carbon\Carbon::parse($d));

        $streak = 0;
        $expected = now()->startOfDay();

        foreach ($days as $day) {
            if ($day->eq($expected) || $day->eq($expected->copy()->subDay())) {
                $streak++;
                $expected = $day->copy()->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }
}
