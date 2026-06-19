<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

/**
 * Requête de création de réunion - CollabSearch
 */
class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     * Normalise scheduled_at / ended_at to UTC so 'after:now' works correctly
     * regardless of the server's local timezone.
     */
    protected function prepareForValidation(): void
    {
        $fields = [];

        // Le frontend envoie "link", le backend attend "meeting_url"
        if ($this->filled('link') && !$this->filled('meeting_url')) {
            $fields['meeting_url'] = $this->link;
        }

        foreach (['scheduled_at', 'ended_at'] as $field) {
            if ($this->filled($field)) {
                try {
                    $fields[$field] = Carbon::parse($this->{$field})->utc()->toDateTimeString();
                } catch (\Throwable) {}
            }
        }

        if ($fields) {
            $this->merge($fields);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'scheduled_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date', 'after:scheduled_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'meeting_url' => ['nullable', 'url', 'max:500'],
            'is_online' => ['nullable', 'boolean'],
            'agenda' => ['nullable', 'string', 'max:5000'],
            'participant_ids' => ['nullable', 'array'],
            'participant_ids.*' => ['exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre de la réunion est obligatoire.',
            'scheduled_at.required' => 'La date et l\'heure sont obligatoires.',
            'scheduled_at.after' => 'La réunion doit être planifiée dans le futur.',
            'ended_at.after' => 'L\'heure de fin doit être après l\'heure de début.',
            'meeting_url.url' => 'Le lien de visioconférence doit être une URL valide.',
            'project_id.exists' => 'Le projet sélectionné n\'existe pas.',
        ];
    }
}
