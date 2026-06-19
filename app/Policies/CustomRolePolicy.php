<?php

namespace App\Policies;

use App\Models\CustomRole;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CustomRolePolicy
{
    use HandlesAuthorization;

    public function view(User $admin, CustomRole $role): bool
    {
        return $role->admin_id === $admin->id;
    }

    public function create(User $admin): bool
    {
        return $admin->isAdmin();
    }

    public function update(User $admin, CustomRole $role): bool
    {
        return $role->admin_id === $admin->id && !$role->is_system;
    }

    public function delete(User $admin, CustomRole $role): bool
    {
        return $role->admin_id === $admin->id && !$role->is_system;
    }

    public function syncPermissions(User $admin, CustomRole $role): bool
    {
        return $role->admin_id === $admin->id && !$role->is_system;
    }
}
