<?php

namespace App\Http\Requests;

use App\Services\PermissionCatalogService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrator');
    }

    public function rules(): array
    {
        return [
            'permissions' => ['required', 'array'],
            'permissions.*' => [
                'string',
                Rule::in(PermissionCatalogService::getAllPermissionKeys())
            ],
        ];
    }
}
