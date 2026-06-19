<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête de mise à jour de tâche - CollabSearch
 */
class UpdateTaskRequest extends FormRequest
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
            'milestone_id' => ['nullable', 'exists:milestones,id'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.string' => 'Le titre doit être une chaîne de caractères.',
            'milestone_id.exists' => 'Le jalon sélectionné n\'existe pas.',
            'priority.in' => 'La priorité doit être : low, medium, high ou urgent.',
            'assignee_id.exists' => 'L\'utilisateur assigné n\'existe pas.',
        ];
    }
}
