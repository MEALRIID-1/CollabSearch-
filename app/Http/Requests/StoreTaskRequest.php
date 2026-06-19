<?php

namespace App\Http\Requests;

use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête de création de tâche - CollabSearch
 */
class StoreTaskRequest extends FormRequest
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
            'milestone_id' => ['nullable', 'exists:milestones,id'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre de la tâche est obligatoire.',
            'title.max' => 'Le titre ne doit pas dépasser 255 caractères.',
            'milestone_id.exists' => 'Le jalon sélectionné n\'existe pas.',
            'priority.in' => 'La priorité doit être : low, medium, high ou urgent.',
            'assignee_id.exists' => 'L\'utilisateur assigné n\'existe pas.',
            'due_date.after_or_equal' => 'La date limite doit être aujourd\'hui ou ultérieure.',
        ];
    }
}
