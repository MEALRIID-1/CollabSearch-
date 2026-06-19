<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrator');
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($this->route('user'))],
            'role' => ['sometimes', 'string', Rule::in(['researcher', 'team_lead', 'institution'])],
            'custom_role_uuid' => ['nullable', 'string', 'uuid'],
            'institution' => ['nullable', 'string', 'max:255'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'orcid' => ['nullable', 'string', 'max:19', 'regex:/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/'],
            'is_active' => ['sometimes', 'boolean'],
            'new_password' => ['nullable', 'string', 'min:8', 'max:255'],
        ];
    }
}
