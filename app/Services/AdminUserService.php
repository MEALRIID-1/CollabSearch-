<?php

namespace App\Services;

use App\Models\CustomRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Service de gestion des utilisateurs administrés.
 */
class AdminUserService
{
    public function __construct(
        private readonly CustomRoleService $customRoleService,
    ) {}

    public function listUsers(User $admin, array $filters): LengthAwarePaginator
    {
        return User::visibleByAdmin($admin->id)
            ->with(['roles', 'customRoles'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('institution', 'like', "%{$search}%");
                });
            })
            ->when(
                !empty($filters['custom_role_uuid']) && $filters['custom_role_uuid'] !== '__all__',
                function ($query) use ($filters) {
                    $customRole = CustomRole::where('uuid', $filters['custom_role_uuid'])->first();
                    if ($customRole) {
                        $query->whereHas('customRoles', function ($q) use ($customRole) {
                            $q->where('custom_roles.id', $customRole->id);
                        });
                    }
                }
            )
            ->when(array_key_exists('is_active', $filters), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active']);
            })
            ->orderBy('last_name')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function createMember(User $admin, array $data, string $origin = 'created', bool $verifyEmail = true): array
    {
        $password = $data['password'] ?? Str::random(12);
        $mustChangePassword = $data['must_change_password'] ?? !isset($data['password']);

        return DB::transaction(function () use ($admin, $data, $origin, $verifyEmail, $password, $mustChangePassword) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($password),
                'institution' => $data['institution'] ?? null,
                'specialty' => $data['specialty'] ?? null,
                'orcid' => $this->generateOrcid(),
                'is_active' => $data['is_active'] ?? true,
                'created_by_admin_id' => $admin->id,
                'must_change_password' => $mustChangePassword,
                'email_verified_at' => $verifyEmail ? now() : null,
            ]);

            $roleName = $data['role'] ?? 'researcher';
            $spatieRole = SpatieRole::findByName($roleName, 'web');
            $user->assignRole($spatieRole);

            // Créer le membership AVANT d'assigner le rôle custom
            // car assignRoleToUser() vérifie isManagedBy() qui lit admin_user_memberships
            $admin->managedUsers()->attach($user->id, [
                'origin' => $origin,
                'is_active' => true,
                'added_at' => now(),
            ]);

            // Assigner le rôle custom si fourni
            if (!empty($data['custom_role_uuid'])) {
                $customRole = CustomRole::where('uuid', $data['custom_role_uuid'])
                    ->where('admin_id', $admin->id)
                    ->first();
                if ($customRole) {
                    $this->customRoleService->assignRoleToUser($admin, $user, $customRole);
                }
            }

            return [
                'user' => $user,
                'password' => $password,
            ];
        });
    }

    public function inviteMember(User $admin, array $data): array
    {
        return $this->createMember($admin, $data, 'invited', false);
    }

    public function updateMember(User $admin, User $member, array $data): User
    {
        $this->ensureManagedByAdmin($admin, $member);

        $updatePayload = [
            'first_name' => $data['first_name'] ?? $member->first_name,
            'last_name' => $data['last_name'] ?? $member->last_name,
            'email' => $data['email'] ?? $member->email,
            'institution' => $data['institution'] ?? $member->institution,
            'specialty' => $data['specialty'] ?? $member->specialty,
            'orcid' => $data['orcid'] ?? $member->orcid,
            'is_active' => $data['is_active'] ?? $member->is_active,
            'must_change_password' => $data['must_change_password'] ?? $member->must_change_password,
        ];

        // Admin resets the user's password
        if (!empty($data['new_password'])) {
            $updatePayload['password'] = $data['new_password'];
        }

        $member->update($updatePayload);

        if (isset($data['role'])) {
            $spatieRole = SpatieRole::findByName($data['role'], 'web');
            $member->syncRoles([$spatieRole]);
        }

        // Mettre à jour le rôle custom si fourni
        if (array_key_exists('custom_role_uuid', $data)) {
            if ($data['custom_role_uuid']) {
                $customRole = CustomRole::where('uuid', $data['custom_role_uuid'])
                    ->where('admin_id', $admin->id)
                    ->first();
                if ($customRole) {
                    $this->customRoleService->assignRoleToUser($admin, $member, $customRole);
                }
            } else {
                $this->customRoleService->removeRoleFromUser($admin, $member);
            }
        }

        if (array_key_exists('is_active', $data) || array_key_exists('origin', $data)) {
            $member->adminOwners()->updateExistingPivot($admin->id, [
                'is_active' => $data['is_active'] ?? $member->is_active,
            ]);
        }

        return $member->fresh();
    }

    public function removeMember(User $admin, User $member): void
    {
        $this->ensureManagedByAdmin($admin, $member);

        $hasOtherOwners = $member->adminOwners()
            ->where('admin_id', '!=', $admin->id)
            ->exists();

        if ($hasOtherOwners) {
            $admin->managedUsers()->detach($member->id);
            return;
        }

        // When the current admin is the only owner, soft delete the user
        // and keep the admin ownership pivot so the trashed user can be restored.
        $member->delete();
    }

    public function listDeletedUsers(User $admin, array $filters): LengthAwarePaginator
    {
        return User::onlyTrashed()
            ->visibleByAdmin($admin->id)
            ->with(['roles', 'customRoles'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('institution', 'like', "%{$search}%");
                });
            })
            ->orderBy('last_name')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function restoreMember(User $admin, User $member): User
    {
        $this->ensureManagedByAdmin($admin, $member);

        $member->restore();

        return $member->fresh();
    }

    protected function ensureManagedByAdmin(User $admin, User $member): void
    {
        if (!$member->isManagedBy($admin->id)) {
            abort(403, 'Vous n\'êtes pas autorisé à gérer cet utilisateur.');
        }
    }

    /**
     * Génère un identifiant au format ORCID (ISO 7064 MOD 11-2) unique.
     * Format : XXXX-XXXX-XXXX-XXXX (15 chiffres + 1 chiffre de contrôle)
     */
    protected function generateOrcid(): string
    {
        do {
            // Générer 15 chiffres aléatoires
            $digits = [];
            for ($i = 0; $i < 15; $i++) {
                $digits[] = random_int(0, 9);
            }

            // Calcul du chiffre de contrôle ISO 7064 MOD 11-2
            $total = 0;
            foreach ($digits as $digit) {
                $total = ($total + $digit) * 2;
            }
            $remainder = 12 - ($total % 11);
            if ($remainder === 10) {
                $checksum = 'X';
            } elseif ($remainder === 11) {
                $checksum = '0';
            } else {
                $checksum = (string) $remainder;
            }

            $all = implode('', $digits) . $checksum;
            $orcid = implode('-', str_split($all, 4));
        } while (User::withTrashed()->where('orcid', $orcid)->exists());

        return $orcid;
    }
}
