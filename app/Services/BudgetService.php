<?php

namespace App\Services;

use App\Enums\BudgetCategory;
use App\Models\ActivityLog;
use App\Models\BudgetLine;
use App\Models\Project;
use App\Notifications\BudgetAlert;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Service de gestion du budget - CollabSearch
 * 
 * Gère les opérations métier liées au budget des projets :
 * lignes budgétaires, résumé, alertes et export.
 */
class BudgetService
{
    /**
     * Créer une ligne budgétaire
     */
    public function createBudgetLine(Project $project, array $data): BudgetLine
    {
        return DB::transaction(function () use ($project, $data) {
            $newSpent = $data['amount_spent'] ?? 0;
            $this->assertBudgetWithinLimit($project, $project->budget_used + $newSpent);

            $budgetLine = BudgetLine::create([
                ...$data,
                'project_id' => $project->id,
            ]);

            // Mettre à jour le budget du projet
            $this->updateProjectBudget($project);

            // Vérifier les alertes
            $this->checkAndNotifyBudgetAlert($project, $budgetLine);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $project->id,
                'action' => ActivityLog::ACTION_CREATE,
                'description' => "Ligne budgétaire '{$budgetLine->description}' créée",
                'subject_type' => BudgetLine::class,
                'subject_id' => $budgetLine->id,
            ]);

            return $budgetLine;
        });
    }

    /**
     * Mettre à jour une ligne budgétaire
     */
    public function updateBudgetLine(BudgetLine $budgetLine, array $data): BudgetLine
    {
        DB::transaction(function () use ($budgetLine, $data) {
            $project = $budgetLine->project;
            $currentSpent = $budgetLine->amount_spent ?? 0;
            $newSpent = array_key_exists('amount_spent', $data) ? ($data['amount_spent'] ?? 0) : $currentSpent;
            $projectUsedAfter = $project->budget_used - $currentSpent + $newSpent;

            $this->assertBudgetWithinLimit($project, $projectUsedAfter);

            $budgetLine->update($data);

            $this->updateProjectBudget($budgetLine->project);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $budgetLine->project_id,
                'action' => ActivityLog::ACTION_UPDATE,
                'description' => "Ligne budgétaire '{$budgetLine->description}' mise à jour",
            ]);
        });

        return $budgetLine->fresh();
    }

    /**
     * Récupérer le résumé budgétaire d'un projet
     */
    public function getBudgetSummary(Project $project): array
    {
        $lines = $project->budgetLines;

        $byCategory = $lines->groupBy('category')->map(function ($group) {
            return [
                'category' => $group->first()->category?->value,
                'category_label' => $group->first()->category?->label(),
                'total_planned' => $group->sum('amount_planned'),
                'total_spent' => $group->sum('amount_spent'),
                'total_remaining' => $group->sum('amount_planned') - $group->sum('amount_spent'),
                'lines_count' => $group->count(),
            ];
        })->values();

        $linePlanned = $lines->sum('amount_planned');
        $lineSpent = $lines->sum('amount_spent');
        $projectUsed = (float) $project->budget_used;
        $projectAllocated = (float) $project->budget_allocated;

        return [
            'total_planned' => $linePlanned,
            'total_spent' => $lineSpent,
            'total_remaining' => $linePlanned - $lineSpent,
            'consumption_percentage' => $linePlanned > 0
                ? round(($lineSpent / $linePlanned) * 100, 2)
                : 0,
            'budget_allocated' => $projectAllocated,
            'budget_used' => $projectUsed,
            'budget_remaining' => $projectAllocated - $projectUsed,
            'project_consumption_percentage' => $projectAllocated > 0
                ? round(($projectUsed / $projectAllocated) * 100, 2)
                : 0,
            'budget_percentage' => $project->budget_percentage,
            'by_category' => $byCategory,
        ];
    }

    /**
     * Vérifier les alertes budgétaires
     */
    public function checkBudgetAlerts(Project $project): array
    {
        $alerts = [];

        // Vérification globale
        if ($project->is_budget_alert) {
            $alerts[] = [
                'type' => 'global',
                'message' => "Le budget du projet a atteint {$project->budget_percentage}% de consommation.",
                'severity' => $project->budget_used > $project->budget_allocated ? 'critical' : 'warning',
            ];
        }

        // Vérification par ligne
        foreach ($project->budgetLines as $line) {
            if ($line->is_over_budget) {
                $alerts[] = [
                    'type' => 'line_over_budget',
                    'line_id' => $line->id,
                    'message' => "La ligne '{$line->description}' dépasse le budget prévu.",
                    'severity' => 'critical',
                ];
            } elseif ($line->is_alert) {
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
     * Récupérer le budget complet d'un projet
     */
    public function getProjectBudget(Project $project): array
    {
        return [
            'project_id' => $project->id,
            'budget_allocated' => (float) $project->budget_allocated,
            'budget_used' => (float) $project->budget_used,
            'budget_percentage' => $project->budget_percentage,
            'is_budget_alert' => $project->is_budget_alert,
            'summary' => $this->getBudgetSummary($project),
            'alerts' => $this->checkBudgetAlerts($project),
        ];
    }

    /**
     * Exporter le budget
     */
    public function exportBudget(Project $project, string $format = 'json'): array
    {
        $summary = $this->getBudgetSummary($project);
        $lines = $project->budgetLines()->orderBy('category')->orderBy('date', 'desc')->get();

        return [
            'project' => [
                'id' => $project->id,
                'title' => $project->title,
                'reference' => $project->reference,
            ],
            'summary' => $summary,
            'lines' => $lines->toArray(),
        ];
    }

    /**
     * Mettre à jour le budget du projet
     */
    private function updateProjectBudget(Project $project): void
    {
        $project->update([
            'budget_used' => $project->budgetLines()->sum('amount_spent'),
        ]);
    }

    private function assertBudgetWithinLimit(Project $project, float $newBudgetUsed): void
    {
        if ($project->budget_allocated > 0 && $newBudgetUsed > $project->budget_allocated) {
            throw ValidationException::withMessages([
                'amount_spent' => ['Le montant dépensé dépasse le budget du projet.'],
            ]);
        }
    }

    /**
     * Vérifier et notifier les alertes budgétaires
     */
    private function checkAndNotifyBudgetAlert(Project $project, BudgetLine $budgetLine): void
    {
        $alerts = $this->checkBudgetAlerts($project);

        if (count($alerts) > 0) {
            $project->lead?->notify(new BudgetAlert($project, $alerts));
        }
    }
}
