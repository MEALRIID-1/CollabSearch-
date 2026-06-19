<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ressource Ligne budgétaire - CollabSearch
 */
class BudgetLineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'category' => $this->category?->value,
            'category_label' => $this->category?->label(),
            'category_color' => $this->category?->color(),
            'description' => $this->description,
            'amount_planned' => (float) $this->amount_planned,
            'amount_spent' => (float) $this->amount_spent,
            'amount_remaining' => (float) $this->amount_remaining,
            'consumption_percentage' => $this->consumption_percentage,
            'is_alert' => $this->is_alert,
            'is_over_budget' => $this->is_over_budget,
            'date' => $this->date?->toISOString(),
            'justification' => $this->justification,
            'reference_document' => $this->reference_document,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
