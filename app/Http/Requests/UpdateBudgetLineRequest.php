<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête de mise à jour de ligne budgétaire - CollabSearch
 */
class UpdateBudgetLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['sometimes', 'string', 'in:personnel,materiel,mission,publication,autre'],
            'description' => ['sometimes', 'string', 'max:500'],
            'amount_planned' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'amount_spent' => ['nullable', 'numeric', 'min:0', 'max:999999999.99', 'lte:amount_planned'],
            'date' => ['nullable', 'date'],
            'justification' => ['nullable', 'string', 'max:2000'],
            'reference_document' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'category.in' => 'La catégorie doit être : personnel, materiel, mission, publication ou autre.',
            'amount_planned.min' => 'Le montant prévu ne peut pas être négatif.',
            'amount_spent.min' => 'Le montant dépensé ne peut pas être négatif.',
            'amount_spent.lte' => 'Le montant dépensé ne peut pas dépasser le montant alloué.',
        ];
    }
}
