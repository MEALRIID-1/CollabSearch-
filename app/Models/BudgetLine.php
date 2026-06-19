<?php

namespace App\Models;

use App\Enums\BudgetCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle Ligne budgétaire - CollabSearch
 * 
 * Représente une ligne du budget d'un projet de recherche.
 * Catégories : personnel, matériel, mission, publication, autre
 */
class BudgetLine extends Model
{
    use HasFactory;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'project_id',
        'category',
        'description',
        'amount_planned',
        'amount_spent',
        'date',
        'justification',
        'reference_document',
    ];

    /**
     * Casts de type d'attribut
     */
    protected function casts(): array
    {
        return [
            'category' => BudgetCategory::class,
            'amount_planned' => 'decimal:2',
            'amount_spent' => 'decimal:2',
            'date' => 'date',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Projet parent de la ligne budgétaire
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accesseurs
    |--------------------------------------------------------------------------
    */

    /**
     * Montant restant sur la ligne budgétaire
     */
    public function getAmountRemainingAttribute(): string
    {
        return number_format($this->amount_planned - $this->amount_spent, 2, '.', '');
    }

    /**
     * Pourcentage consommé de la ligne budgétaire
     */
    public function getConsumptionPercentageAttribute(): float
    {
        if ($this->amount_planned <= 0) {
            return 0;
        }

        return round(($this->amount_spent / $this->amount_planned) * 100, 2);
    }

    /**
     * Vérifie si la ligne budgétaire dépasse le seuil d'alerte
     */
    public function getIsAlertAttribute(): bool
    {
        return $this->consumption_percentage >= 80;
    }

    /**
     * Vérifie si la ligne est en dépassement
     */
    public function getIsOverBudgetAttribute(): bool
    {
        return $this->amount_spent > $this->amount_planned;
    }
}
