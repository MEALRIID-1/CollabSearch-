<?php

namespace App\Http\Resources;

use App\Enums\Permission;
use App\Enums\PermissionModule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomRoleDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Clés de permissions accordées à ce rôle
        $grantedKeys = $this->permissions->pluck('permission_key')->toArray();

        // Construire les permissions groupées par module
        $permissionsByModule = [];
        foreach (PermissionModule::cases() as $module) {
            $modulePerms = [];
            foreach (Permission::cases() as $permission) {
                if ($permission->module() === $module) {
                    $modulePerms[] = [
                        'key'     => $permission->value,
                        'label'   => $permission->label(),
                        'granted' => in_array($permission->value, $grantedKeys, true),
                    ];
                }
            }
            $permissionsByModule[] = [
                'module'      => $module->value,
                'label'       => $module->label(),
                'icon'        => $module->icon(),
                'permissions' => $modulePerms,
            ];
        }

        // Utilisateurs ayant ce rôle
        $users = $this->whenLoaded('users', function () {
            return $this->users->map(fn($user) => [
                'uuid'       => $user->uuid ?? null,
                'name'       => $user->full_name,
                'email'      => $user->email,
                'avatarPath' => $user->avatar,
            ])->values();
        });

        return [
            'uuid'                 => $this->uuid,
            'name'                 => $this->name,
            'slug'                 => $this->slug,
            'color'                => $this->color,
            'description'          => $this->description,
            'isSystem'             => $this->is_system,
            'usersCount'           => $this->users_count,
            'permissionsCount'     => count($grantedKeys),
            'permissionKeys'       => $grantedKeys,
            'permissionsByModule'  => $permissionsByModule,
            'users'                => $users,
            'createdAt'            => $this->created_at?->toISOString(),
        ];
    }
}
