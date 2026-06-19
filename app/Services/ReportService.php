<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Service de génération de rapports - CollabSearch
 * 
 * Génère les rapports de projets, d'équipes et budgétaires.
 * Utilise le cache Redis avec un TTL de 5 minutes.
 */
class ReportService
{
    /** Durée de cache en secondes (5 minutes) */
    private const CACHE_TTL = 300;

    /**
     * Générer un rapport de projet
     */
    public function generateProjectReport(int $projectId, string $format = 'json'): array
    {
        return Cache::remember("report_project_{$projectId}", self::CACHE_TTL, function () use ($projectId) {
            $project = Project::with([
                'lead', 'members', 'milestones', 'tasks',
                'publications', 'budgetLines', 'meetings',
            ])->findOrFail($projectId);

            $tasksByStatus = $project->tasks->groupBy('status')->map->count();

            return [
                'projet' => [
                    'id' => $project->id,
                    'titre' => $project->title,
                    'reference' => $project->reference,
                    'statut' => $project->status?->label(),
                    'chef' => $project->lead?->full_name,
                    'date_debut' => $project->start_date?->format('d/m/Y'),
                    'date_fin' => $project->end_date?->format('d/m/Y'),
                    'laboratoire' => $project->laboratory,
                    'source_financement' => $project->funding_source,
                ],
                'equipe' => [
                    'nombre_membres' => $project->members->count(),
                    'membres' => $project->members->map(fn ($m) => [
                        'nom' => $m->full_name,
                        'role' => $m->pivot->role,
                        'specialite' => $m->specialty,
                    ]),
                ],
                'taches' => [
                    'total' => $project->tasks->count(),
                    'par_statut' => $tasksByStatus,
                    'progression' => $project->progress,
                    'en_retard' => $project->tasks->filter(fn ($t) => $t->is_overdue)->count(),
                ],
                'jalons' => [
                    'total' => $project->milestones->count(),
                    'completes' => $project->milestones->filter(fn ($m) => $m->is_completed)->count(),
                    'en_retard' => $project->milestones->filter(fn ($m) => $m->is_overdue)->count(),
                ],
                'publications' => [
                    'total' => $project->publications->count(),
                    'par_type' => $project->publications->groupBy('type')->map->count(),
                ],
                'budget' => [
                    'alloue' => (float) $project->budget_allocated,
                    'depense' => (float) $project->budget_used,
                    'pourcentage' => $project->budget_percentage,
                ],
                'reunions' => [
                    'total' => $project->meetings->count(),
                ],
                'genere_le' => now()->toISOString(),
            ];
        });
    }

    /**
     * Générer un rapport d'équipe
     */
    public function generateTeamReport(User $user, ?int $projectId = null, string $format = 'json'): array
    {
        $cacheKey = "report_team_{$user->id}_" . ($projectId ?? 'all');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $projectId) {
            $projectsQuery = Project::where('lead_id', $user->id)
                ->orWhereHas('members', fn ($q) => $q->where('user_id', $user->id));

            if ($projectId) {
                $projectsQuery->where('id', $projectId);
            }

            $projects = $projectsQuery->with(['tasks', 'members', 'publications'])->get();

            $allTasks = $projects->flatMap->tasks;

            return [
                'utilisateur' => [
                    'nom' => $user->full_name,
                    'specialite' => $user->specialty,
                    'institution' => $user->institution,
                ],
                'projets' => [
                    'total' => $projects->count(),
                    'actifs' => $projects->where('status', 'active')->count(),
                    'details' => $projects->map(fn ($p) => [
                        'titre' => $p->title,
                        'statut' => $p->status?->label(),
                        'progression' => $p->progress,
                        'taches_total' => $p->tasks->count(),
                        'taches_completees' => $p->tasks->whereIn('status', ['submitted', 'validated', 'refused'])->count(),
                    ]),
                ],
                'taches' => [
                    'total' => $allTasks->count(),
                    'a_faire' => $allTasks->where('status', 'todo')->count(),
                    'en_cours' => $allTasks->where('status', 'in_progress')->count(),
                    'soumises' => $allTasks->where('status', 'submitted')->count(),
                    'validees' => $allTasks->where('status', 'validated')->count(),
                    'refusees' => $allTasks->where('status', 'refused')->count(),
                    'en_retard' => $allTasks->filter(fn ($t) => $t->is_overdue)->count(),
                ],
                'publications' => [
                    'total' => $projects->flatMap->publications->count(),
                ],
                'genere_le' => now()->toISOString(),
            ];
        });
    }

    /**
     * Générer un rapport budgétaire
     */
    public function generateBudgetReport(int $projectId, string $format = 'json'): array
    {
        return Cache::remember("report_budget_{$projectId}", self::CACHE_TTL, function () use ($projectId) {
            $project = Project::with(['budgetLines', 'lead'])->findOrFail($projectId);

            $linesByCategory = $project->budgetLines->groupBy('category')->map(function ($lines) {
                return [
                    'categorie' => $lines->first()->category?->label(),
                    'montant_prevu' => $lines->sum('amount_planned'),
                    'montant_depense' => $lines->sum('amount_spent'),
                    'montant_restant' => $lines->sum('amount_planned') - $lines->sum('amount_spent'),
                    'nombre_lignes' => $lines->count(),
                    'en_depassement' => $lines->filter(fn ($l) => $l->is_over_budget)->count(),
                ];
            })->values();

            return [
                'projet' => [
                    'id' => $project->id,
                    'titre' => $project->title,
                    'chef' => $project->lead?->full_name,
                ],
                'synthese' => [
                    'budget_alloue' => (float) $project->budget_allocated,
                    'budget_utilise' => (float) $project->budget_used,
                    'pourcentage_consommation' => $project->budget_percentage,
                    'alerte_budget' => $project->is_budget_alert,
                ],
                'par_categorie' => $linesByCategory,
                'lignes_en_alerte' => $project->budgetLines->filter(fn ($l) => $l->is_alert || $l->is_over_budget)
                    ->map(fn ($l) => [
                        'description' => $l->description,
                        'categorie' => $l->category?->label(),
                        'prevu' => (float) $l->amount_planned,
                        'depense' => (float) $l->amount_spent,
                        'pourcentage' => $l->consumption_percentage,
                        'en_depassement' => $l->is_over_budget,
                    ])->values(),
                'genere_le' => now()->toISOString(),
            ];
        });
    }
}
