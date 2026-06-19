<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Milestone extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'due_date',
        'completed_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->completed_at) {
            return false;
        }
        return $this->due_date?->isPast() ?? false;
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->completed_at !== null;
    }

    /**
     * Verifie si toutes les taches du jalon sont validees.
     * Si oui, complete automatiquement le jalon.
     */
    public function checkAndComplete(): bool
    {
        if ($this->completed_at) {
            return false;
        }

        $totalTasks = $this->tasks()->count();
        if ($totalTasks === 0) {
            return false;
        }

        // Utiliser ->value pour eviter les problemes de cast enum dans la comparaison SQL
        $validatedTasks = $this->tasks()
            ->where('status', \App\Enums\TaskStatus::VALIDATED->value)
            ->count();

        if ($validatedTasks === $totalTasks) {
            $this->update([
                'completed_at' => now(),
                'status' => 'completed',
            ]);
            return true;
        }

        return false;
    }
}
