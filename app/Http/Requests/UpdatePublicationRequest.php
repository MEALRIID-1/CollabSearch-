<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Requête de mise à jour de publication - CollabSearch
 */
class UpdatePublicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:500'],
            'type' => ['sometimes', 'string', 'in:article,conference,these,rapport,livre'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'authors' => ['nullable', 'array'],
            'authors.*' => ['string', 'max:255'],
            'abstract' => ['nullable', 'string', 'max:10000'],
            'doi' => ['nullable', 'string', 'max:255'],
            'journal' => ['nullable', 'string', 'max:255'],
            'conference_name' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'volume' => ['nullable', 'string', 'max:50'],
            'pages' => ['nullable', 'string', 'max:50'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'url' => ['nullable', 'url', 'max:500'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string', 'max:100'],
            'is_published' => ['nullable', 'boolean'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:51200'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.string' => 'Le titre doit être une chaîne de caractères.',
            'type.in' => 'Le type doit être : article, conference, these, rapport ou livre.',
            'project_id.exists' => 'Le projet sélectionné n\'existe pas.',
            'url.url' => 'L\'URL doit être valide.',
        ];
    }
}
