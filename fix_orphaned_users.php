<?php
// Script de réparation des utilisateurs orphelins
// Exécuter via : php fix_orphaned_users.php  (depuis le dossier backend/)

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$orphans = DB::table('users')
    ->whereNotNull('created_by_admin_id')
    ->whereNull('deleted_at')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('admin_user_memberships')
            ->whereColumn('admin_user_memberships.user_id', 'users.id');
    })
    ->get(['id', 'first_name', 'last_name', 'email', 'created_by_admin_id', 'created_at']);

if ($orphans->isEmpty()) {
    echo "Aucun utilisateur orphelin trouve.\n";
    exit(0);
}

echo "Utilisateurs orphelins trouves : " . $orphans->count() . "\n\n";
foreach ($orphans as $user) {
    echo "  - [{$user->id}] {$user->first_name} {$user->last_name} ({$user->email}) -> admin_id={$user->created_by_admin_id}\n";
}

echo "\nInsertion des pivots manquants...\n";

foreach ($orphans as $user) {
    DB::table('admin_user_memberships')->insertOrIgnore([
        'admin_id'  => $user->created_by_admin_id,
        'user_id'   => $user->id,
        'origin'    => 'created',
        'is_active' => true,
        'added_at'  => $user->created_at,
    ]);
    echo "  OK user #{$user->id} lie a admin #{$user->created_by_admin_id}\n";
}

echo "\nTermine.\n";
