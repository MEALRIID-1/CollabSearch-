<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomRoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid'             => $this->uuid,
            'name'             => $this->name,
            'slug'             => $this->slug,
            'color'            => $this->color,
            'description'      => $this->description,
            'isSystem'         => $this->is_system,
            'usersCount'       => $this->users_count,
            'permissionsCount' => $this->whenLoaded('permissions', fn() => $this->permissions->count(), 0),
            'permissionKeys'   => $this->whenLoaded('permissions', fn() => $this->permissions->pluck('permission_key')->values(), []),
            'createdAt'        => $this->created_at?->toISOString(),
        ];
    }
}
