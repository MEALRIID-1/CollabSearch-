<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête de mise à jour de projet - CollabSearch
 */
class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'budget_allocated' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string', 'max:100'],
            'laboratory' => ['nullable', 'string', 'max:255'],
            'funding_source' => ['nullable', 'string', 'max:255'],
            'lead_id' => ['nullable', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.string' => 'Le titre doit être une chaîne de caractères.',
            'title.max' => 'Le titre ne doit pas dépasser 255 caractères.',
            'end_date.after' => 'La date de fin doit être postérieure à la date de début.',
            'budget_allocated.min' => 'Le budget alloué ne peut pas être négatif.',
            'lead_id.exists' => 'Le chef de projet sélectionné n\'existe pas.',
        ];
    }
}
