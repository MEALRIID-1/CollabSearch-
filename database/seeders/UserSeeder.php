<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * @deprecated Supprimé — les utilisateurs s'inscrivent via l'interface.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Intentionnellement vide.
        // Les administrateurs s'inscrivent via /register.
        // Les autres utilisateurs sont invités/créés par l'admin depuis l'interface.
    }
}
