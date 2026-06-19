<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête de mise à jour de réunion - CollabSearch
 */
class UpdateMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalise les champs avant validation :
     * - link → meeting_url (alias frontend)
     * - scheduled_at / ended_at → UTC string
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
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'scheduled_at' => ['nullable', 'date'],
            'ended_at' => ['nullable', 'date', 'after:scheduled_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'meeting_url' => ['nullable', 'url', 'max:500'],
            'is_online' => ['nullable', 'boolean'],
            'agenda' => ['nullable', 'string', 'max:5000'],
            'minutes' => ['nullable', 'string', 'max:10000'],
            'status' => ['nullable', 'string', 'in:scheduled,in_progress,completed,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'ended_at.after' => 'L\'heure de fin doit être après l\'heure de début.',
            'meeting_url.url' => 'Le lien de visioconférence doit être une URL valide.',
            'status.in' => 'Le statut doit être : scheduled, in_progress, completed ou cancelled.',
        ];
    }
}
