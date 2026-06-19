<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InviteAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrator');
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['nullable', 'string', Rule::in(['researcher', 'team_lead', 'institution'])],
            'institution' => ['nullable', 'string', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'orcid' => ['nullable', 'string', 'max:19', 'regex:/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
