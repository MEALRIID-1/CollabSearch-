<?php

namespace App\Http\Requests;

use App\Enums\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête de création de projet - CollabSearch
 */
class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['nullable', 'date', 'after_or_equal:today'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'budget_allocated' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string', 'max:100'],
            'laboratory' => ['nullable', 'string', 'max:255'],
            'funding_source' => ['nullable', 'string', 'max:255'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre du projet est obligatoire.',
            'title.max' => 'Le titre ne doit pas dépasser 255 caractères.',
            'start_date.after_or_equal' => 'La date de début doit être aujourd\'hui ou ultérieure.',
            'end_date.after' => 'La date de fin doit être postérieure à la date de début.',
            'budget_allocated.min' => 'Le budget alloué ne peut pas être négatif.',
            'keywords.array' => 'Les mots-clés doivent être fournis sous forme de liste.',
        ];
    }
}
