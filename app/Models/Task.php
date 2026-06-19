<?php

namespace App\Models;

use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modèle Tâche - CollabSearch
 * 
 * Représente une tâche dans le tableau Kanban d'un projet.
 * Cycle de vie : à faire → en cours → terminé → validé
 */
class Task extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'project_id',
        'milestone_id',
        'title',
        'description',
        'status',
        'priority',
        'assignee_id',
        'due_date',
        'completed_at',
        'validated_at',
        'validated_by',
    ];

    /**
     * Casts de type d'attribut
     */
    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'validated_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Constantes de priorité
    |--------------------------------------------------------------------------
    */

    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Projet parent de la tâche
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Jalon associé à la tâche
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(Milestone::class);
    }

    /**
     * Utilisateur assigné à la tâche
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /**
     * Utilisateur ayant validé la tâche
     */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * Commentaires de la tâche
     */
    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    /**
     * Pièces jointes de la tâche
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accesseurs
    |--------------------------------------------------------------------------
    */

    /**
     * Vérifie si la tâche est en retard
     */
    public function getIsOverdueAttribute(): bool
    {
        if (in_array($this->status, [TaskStatus::SUBMITTED, TaskStatus::VALIDATED, TaskStatus::REFUSED])) {
            return false;
        }

        return $this->due_date?->isPast() ?? false;
    }

    /**
     * Libellé de la priorité en français
     */
    public function getPriorityLabelAttribute(): string
    {
        return match ($this->priority) {
            self::PRIORITY_LOW => 'Basse',
            self::PRIORITY_MEDIUM => 'Moyenne',
            self::PRIORITY_HIGH => 'Haute',
            self::PRIORITY_URGENT => 'Urgente',
            default => 'Non définie',
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Méthodes métier
    |--------------------------------------------------------------------------
    */

    /**
     * Vérifie si la tâche peut passer au statut donné
     */
    public function canTransitionTo(TaskStatus $status): bool
    {
        return $this->status->canTransitionTo($status);
    }
}
