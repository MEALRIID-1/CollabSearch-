<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Crée les rôles Spatie requis pour le fonctionnement de l'authentification.
 *
 * Ces rôles sont utilisés UNIQUEMENT pour les vérifications internes
 * via hasRole() (middleware, policies). Ils n'ont aucune permission Spatie
 * attachée — le système de permissions fins passe par custom_role_permissions.
 *
 * Rôles :
 *   - administrator : premier utilisateur inscrit, accès complet
 *   - researcher    : rôle par défaut pour les autres inscriptions
 *   - team_lead     : rôle Spatie conservé pour compatibilité policies
 *   - institution   : rôle Spatie conservé pour compatibilité policies
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $roles = ['administrator', 'researcher', 'team_lead', 'institution'];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }
    }
}
