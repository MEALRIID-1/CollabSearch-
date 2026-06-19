<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreAdminUserRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'password' => ['nullable', Password::defaults()],
            'role' => ['nullable', 'string', Rule::in(['researcher', 'team_lead', 'institution'])],
            'custom_role_uuid' => ['nullable', 'string', 'uuid'],
            'institution' => ['nullable', 'string', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            // orcid généré automatiquement côté backend
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
