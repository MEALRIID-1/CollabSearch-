<?php

namespace App\Http\Requests;

use App\Services\PermissionCatalogService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrator');
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                function ($attribute, $value, $fail) {
                    if (strtolower($value) === 'administrator') {
                        $fail('Ce nom est réservé au système.');
                    }
                }
            ],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => [
                'string',
                Rule::in(PermissionCatalogService::getAllPermissionKeys())
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du rôle est obligatoire.',
            'permissions.required' => 'Sélectionnez au moins une permission.',
            'permissions.*.in' => 'La permission :input n\'existe pas.',
        ];
    }
}
