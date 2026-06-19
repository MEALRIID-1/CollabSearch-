<?php

namespace App\Observers;

use App\Models\CustomRole;
use App\Models\ActivityLog;

class CustomRoleObserver
{
    public function created(CustomRole $role): void
    {
        ActivityLog::create([
            'user_id' => auth()->id() ?? $role->admin_id,
            'action' => 'role.created',
            'description' => "Rôle personnalisé '{$role->name}' créé",
            'subject_type' => CustomRole::class,
            'subject_id' => $role->id,
        ]);
    }

    public function updated(CustomRole $role): void
    {
        ActivityLog::create([
            'user_id' => auth()->id() ?? $role->admin_id,
            'action' => 'role.updated',
            'description' => "Rôle personnalisé '{$role->name}' mis à jour",
            'subject_type' => CustomRole::class,
            'subject_id' => $role->id,
        ]);
    }

    public function deleted(CustomRole $role): void
    {
        ActivityLog::create([
            'user_id' => auth()->id() ?? $role->admin_id,
            'action' => 'role.deleted',
            'description' => "Rôle personnalisé '{$role->name}' supprimé",
        ]);
    }
}
