<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    protected $signature = 'app:make-admin {email : Adresse e-mail de l\'utilisateur à promouvoir}';

    protected $description = 'Promouvoir un utilisateur au rôle administrateur';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("Aucun utilisateur trouvé avec l'adresse : {$email}");
            return self::FAILURE;
        }

        // Retirer tous les rôles existants et assigner administrator
        $user->syncRoles(['administrator']);

        // Vider le cache des permissions Spatie
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->info("✓ {$user->full_name} ({$email}) est maintenant administrateur.");
        return self::SUCCESS;
    }
}
