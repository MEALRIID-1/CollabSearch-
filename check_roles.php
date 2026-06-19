<?php

$roles = \App\Models\CustomRole::withCount('permissions')->get();
foreach ($roles as $r) {
    $admin = \App\Models\User::find($r->admin_id);
    echo '[' . ($r->is_system ? 'SYSTEME' : 'CUSTOM') . '] ' . $r->name
        . ' - ' . $r->permissions_count . ' permissions'
        . ' - admin: ' . ($admin ? $admin->email : '?')
        . ' - ' . $r->users_count . ' utilisateur(s)' . PHP_EOL;
}

echo PHP_EOL . 'Admins distincts ayant cree des roles : ';
echo \App\Models\CustomRole::distinct('admin_id')->count('admin_id') . PHP_EOL;
