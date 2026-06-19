<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ressource Utilisateur - CollabSearch
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'initials' => $this->initials,
            'email' => $this->email,
            'institution' => $this->institution,
            'specialty' => $this->specialty,
            'orcid' => $this->orcid,
            'avatar' => $this->avatar,
            'is_active' => $this->is_active,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'custom_role' => $this->whenLoaded('customRoles', function () {
                $first = $this->customRoles->first();
                if (!$first) return null;
                return [
                    'uuid'  => $first->uuid,
                    'name'  => $first->name,
                    'color' => $first->color,
                    'slug'  => $first->slug,
                ];
            }),
            // Flat list of permission keys from the user's custom role(s).
            // Administrators bypass all checks on the frontend.
            'permissions' => $this->whenLoaded('customRoles', function () {
                return $this->customRoles
                    ->flatMap(fn ($role) => $role->permissions->pluck('permission_key'))
                    ->unique()
                    ->values()
                    ->toArray();
            }, []),
            'projects_count' => $this->whenCounted('projects'),
            'publications_count' => $this->whenCounted('publications'),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
