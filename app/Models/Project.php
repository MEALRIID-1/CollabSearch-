<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modèle Projet - CollabSearch
 * 
 * Représente un projet de recherche scientifique avec son cycle de vie :
 * brouillon → soumis → approuvé/rejeté → actif → archivé
 */
class Project extends Model
{
    use HasFactory;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'title',
        'description',
        'status',
        'lead_id',
        'start_date',
        'end_date',
        'budget_allocated',
        'budget_used',
        'reference',
        'keywords',
        'laboratory',
        'funding_source',
    ];

    /**
     * Casts de type d'attribut
     */
    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'budget_allocated' => 'decimal:2',
            'budget_used' => 'decimal:2',
            'keywords' => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Constantes du workflow
    |--------------------------------------------------------------------------
    */

    /** Seuil d'alerte budgétaire (pourcentage) */
    public const BUDGET_ALERT_THRESHOLD = 80;

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Chef de projet
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lead_id');
    }

    /**
     * Membres du projet
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Jalons du projet
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class);
    }

    /**
     * Tâches du projet
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Publications du projet
     */
    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class);
    }

    /**
     * Lignes budgétaires du projet
     */
    public function budgetLines(): HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }

    /**
     * Réunions du projet
     */
    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class);
    }

    /**
     * Journal d'activité du projet
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Conversations IA associées au projet
     */
    public function aiConversations(): HasMany
    {
        return $this->hasMany(AiConversation::class);
    }

    /**
     * Contextes IA associés au projet
     */
    public function aiContexts(): HasMany
    {
        return $this->hasMany(AiContext::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accesseurs & Mutateurs
    |--------------------------------------------------------------------------
    */

    /**
     * Pourcentage du budget utilisé
     */
    public function getBudgetPercentageAttribute(): float
    {
        if ($this->budget_allocated <= 0) {
            return 0;
        }

        return round(($this->budget_used / $this->budget_allocated) * 100, 2);
    }

    /**
     * Vérifie si le budget dépasse le seuil d'alerte
     */
    public function getIsBudgetAlertAttribute(): bool
    {
        return $this->budget_percentage >= self::BUDGET_ALERT_THRESHOLD;
    }

    /**
     * Nombre de tâches terminées
     */
    public function getCompletedTasksCountAttribute(): int
    {
        return $this->tasks()
            ->where('status', \App\Enums\TaskStatus::VALIDATED)
            ->count();
    }

    /**
     * Progression globale du projet (pourcentage) — basee sur les taches validees uniquement
     */
    public function getProgressAttribute(): float
    {
        $totalTasks = $this->tasks()->count();
        if ($totalTasks === 0) {
            return 0;
        }

        $validatedTasks = $this->completed_tasks_count;

        return round(($validatedTasks / $totalTasks) * 100, 2);
    }

    /*
    |--------------------------------------------------------------------------
    | Méthodes métier
    |--------------------------------------------------------------------------
    */

    /**
     * Vérifie si le projet peut passer au statut donné
     */
    public function canTransitionTo(ProjectStatus $status): bool
    {
        return $this->status->canTransitionTo($status);
    }

    /**
     * Vérifie si un utilisateur est membre du projet
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Vérifie si un utilisateur est le chef du projet
     */
    public function isLead(User $user): bool
    {
        return $this->lead_id === $user->id;
    }
}
