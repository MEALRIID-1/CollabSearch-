<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder principal - CollabSearch
 *
 * Initialise uniquement les données système requises au démarrage.
 * Les utilisateurs s'inscrivent via l'interface ; les rôles custom
 * sont créés par l'administrateur depuis la page Rôles & Permissions.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Crée les rôles Spatie (administrator, researcher, …)
            // requis pour que assignRole() fonctionne à l'inscription.
            RoleSeeder::class,

            // Synchronise le CustomRole système "Administrateur" avec toutes
            // les permissions pour tout admin déjà présent en base.
            // (no-op sur une DB vide — utile après migrate:fresh sur DB existante)
            SystemPermissionsSeeder::class,
        ]);
    }
}
