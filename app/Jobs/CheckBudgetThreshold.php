<?php

namespace App\Jobs;

use App\Models\Project;
use App\Notifications\BudgetAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Tâche de vérification des seuils budgétaires - CollabSearch
 * 
 * Vérifie périodiquement les budgets des projets actifs
 * et envoie des alertes en cas de dépassement de seuil.
 */
class CheckBudgetThreshold implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Nombre de tentatives en cas d'échec */
    public int $tries = 2;

    /** Délai d'attente (secondes) */
    public int $timeout = 120;

    /**
     * Créer une nouvelle instance de la tâche
     */
    public function __construct() {}

    /**
     * Exécuter la tâche
     */
    public function handle(): void
    {
        try {
            $projects = Project::where('status', 'active')
                ->where('budget_allocated', '>', 0)
                ->with(['budgetLines', 'lead'])
                ->get();

            $alertCount = 0;

            foreach ($projects as $project) {
                $alerts = $this->checkProjectBudget($project);

                if (count($alerts) > 0) {
                    // Notifier le chef de projet
                    if ($project->lead) {
                        $project->lead->notify(new BudgetAlert($project, $alerts));
                    }

                    // Notifier les administrateurs
                    $admins = \App\Models\User::role('administrator')->get();
                    foreach ($admins as $admin) {
                        $admin->notify(new BudgetAlert($project, $alerts));
                    }

                    $alertCount++;
                }
            }

            Log::info("Vérification des seuils budgétaires terminée", [
                'projects_checked' => $projects->count(),
                'alerts_sent' => $alertCount,
            ]);
        } catch (\Exception $e) {
            Log::error("Échec de la vérification des seuils budgétaires", [
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Vérifier le budget d'un projet
     */
    private function checkProjectBudget(Project $project): array
    {
        $alerts = [];

        // Vérification globale du projet
        if ($project->budget_percentage >= 80) {
            $severity = $project->budget_used > $project->budget_allocated ? 'critical' : 'warning';
            $alerts[] = [
                'type' => 'global',
                'message' => "Le budget du projet a atteint {$project->budget_percentage}% de consommation.",
                'severity' => $severity,
            ];
        }

        // Vérification par ligne budgétaire
        foreach ($project->budgetLines as $line) {
            if ($line->amount_spent > $line->amount_planned) {
                $alerts[] = [
                    'type' => 'line_over_budget',
                    'line_id' => $line->id,
                    'message' => "La ligne '{$line->description}' dépasse le budget prévu ({$line->consumption_percentage}%).",
                    'severity' => 'critical',
                ];
            } elseif ($line->consumption_percentage >= 80) {
                $alerts[] = [
                    'type' => 'line_warning',
                    'line_id' => $line->id,
                    'message' => "La ligne '{$line->description}' a atteint {$line->consumption_percentage}% de consommation.",
                    'severity' => 'warning',
                ];
            }
        }

        return $alerts;
    }

    /**
     * Gérer l'échec de la tâche
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Tâche de vérification budgétaire échouée définitivement", [
            'error' => $exception->getMessage(),
        ]);
    }
}
