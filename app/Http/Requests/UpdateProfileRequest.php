<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Requête de mise à jour du profil - CollabSearch
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($this->user()->id)],
            'institution' => ['nullable', 'string', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'orcid' => ['nullable', 'string', 'max:19', 'regex:/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.string' => 'Le prénom doit être une chaîne de caractères.',
            'last_name.string' => 'Le nom doit être une chaîne de caractères.',
            'email.email' => 'L\'adresse e-mail doit être valide.',
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'avatar.image' => 'L\'avatar doit être une image.',
            'avatar.max' => 'L\'avatar ne doit pas dépasser 2 Mo.',
            'orcid.regex' => 'Le format ORCID est invalide.',
        ];
    }
}
