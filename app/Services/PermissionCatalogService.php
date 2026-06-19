<?php

namespace App\Services;

use App\Enums\Permission;
use App\Enums\PermissionModule;

class PermissionCatalogService
{
    /**
     * Retourne toutes les permissions groupées par module.
     */
    public function getAllPermissions(): array
    {
        $catalog = [];

        foreach (PermissionModule::cases() as $module) {
            $modulePermissions = [];

            foreach (Permission::cases() as $permission) {
                if ($permission->module() === $module) {
                    $modulePermissions[] = [
                        'key' => $permission->value,
                        'label' => $permission->label(),
                    ];
                }
            }

            $catalog[] = [
                'module' => $module->value,
                'label' => $module->label(),
                'icon' => $module->icon(),
                'permissions' => $modulePermissions,
            ];
        }

        return $catalog;
    }

    /**
     * Retourne les permissions pour un module donné.
     */
    public function getPermissionsByModule(string $moduleVal): array
    {
        $module = PermissionModule::tryFrom($moduleVal);
        if (!$module) {
            return [];
        }

        $modulePermissions = [];
        foreach (Permission::cases() as $permission) {
            if ($permission->module() === $module) {
                $modulePermissions[] = [
                    'key' => $permission->value,
                    'label' => $permission->label(),
                ];
            }
        }

        return $modulePermissions;
    }

    /**
     * Vérifie si une clé de permission est valide.
     */
    public static function isValidPermission(string $key): bool
    {
        return Permission::tryFrom($key) !== null;
    }

    /**
     * Retourne toutes les clés de permissions sous forme de tableau de chaînes.
     */
    public static function getAllPermissionKeys(): array
    {
        return Permission::allKeys();
    }
}
