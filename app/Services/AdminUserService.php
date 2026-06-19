<?php

namespace App\Services;

use App\Enums\Permission;
use App\Models\CustomRole;
use App\Models\CustomRolePermission;
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
                'first_name'           => $data['first_name'],
                'last_name'            => $data['last_name'],
                'email'                => $data['email'],
                'password'             => Hash::make($password),
                'institution'          => $data['institution'] ?? null,
                'specialty'            => $data['specialty'] ?? null,
                'orcid'                => $this->generateOrcid(),
                'is_active'            => $data['is_active'] ?? true,
                'created_by_admin_id'  => $admin->id,
                'must_change_password' => $mustChangePassword,
                'email_verified_at'    => $verifyEmail ? now() : null,
            ]);

            $roleName   = $data['role'] ?? 'researcher';
            $spatieRole = SpatieRole::findByName($roleName, 'web');
            $user->assignRole($spatieRole);

            // Membership AVANT rôle custom (assignRoleToUser vérifie isManagedBy)
            $admin->managedUsers()->attach($user->id, [
                'origin'    => $origin,
                'is_active' => true,
                'added_at'  => now(),
            ]);

            // Rôle custom fourni → l'utiliser, sinon → rôle par défaut selon Spatie
            if (!empty($data['custom_role_uuid'])) {
                $customRole = CustomRole::where('uuid', $data['custom_role_uuid'])
                    ->where('admin_id', $admin->id)
                    ->first();
                if ($customRole) {
                    $this->customRoleService->assignRoleToUser($admin, $user, $customRole);
                }
            } else {
                $defaultRole = $this->getOrCreateDefaultCustomRole($admin, $roleName);
                if ($defaultRole) {
                    $this->customRoleService->assignRoleToUser($admin, $user, $defaultRole);
                }
            }

            return ['user' => $user, 'password' => $password];
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
            'first_name'           => $data['first_name']           ?? $member->first_name,
            'last_name'            => $data['last_name']            ?? $member->last_name,
            'email'                => $data['email']                ?? $member->email,
            'institution'          => $data['institution']          ?? $member->institution,
            'specialty'            => $data['specialty']            ?? $member->specialty,
            'orcid'                => $data['orcid']                ?? $member->orcid,
            'is_active'            => $data['is_active']            ?? $member->is_active,
            'must_change_password' => $data['must_change_password'] ?? $member->must_change_password,
        ];

        if (!empty($data['new_password'])) {
            $updatePayload['password'] = $data['new_password'];
        }

        $member->update($updatePayload);

        $newSpatieRole = null;
        if (isset($data['role'])) {
            $newSpatieRole = SpatieRole::findByName($data['role'], 'web');
            $member->syncRoles([$newSpatieRole]);
        }

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
        } elseif ($newSpatieRole) {
            // Rôle Spatie changé sans custom_role_uuid → assigner défaut si l'utilisateur n'en a pas
            $member->load('customRoles');
            if ($member->customRoles->isEmpty()) {
                $defaultRole = $this->getOrCreateDefaultCustomRole($admin, $newSpatieRole->name);
                if ($defaultRole) {
                    $this->customRoleService->assignRoleToUser($admin, $member, $defaultRole);
                }
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
     * Proxy public pour assignRoleToUser — utilisé par CheckCustomPermission.
     */
    public function assignDefaultRoleToUser(User $admin, User $user, CustomRole $role): void
    {
        $this->customRoleService->assignRoleToUser($admin, $user, $role);
    }

    /**
     * Trouve ou crée le rôle custom par défaut pour un rôle Spatie donné.
     * Créé une seule fois par admin (slug = "default_{spatieRole}").
     */
    public function getOrCreateDefaultCustomRole(User $admin, string $spatieRole): ?CustomRole
    {
        $slug     = 'default_' . $spatieRole;
        $existing = CustomRole::where('admin_id', $admin->id)->where('slug', $slug)->first();

        if ($existing) {
            return $existing;
        }

        $researcherPerms = [
            Permission::PROJECTS_VIEW_LIST->value,
            Permission::PROJECTS_VIEW_DETAIL->value,
            Permission::PROJECTS_SUBMIT->value,
            Permission::TASKS_VIEW->value,
            Permission::TASKS_CREATE->value,
            Permission::TASKS_EDIT_OWN->value,
            Permission::TASKS_DELETE_OWN->value,
            Permission::TASKS_CHANGE_STATUS->value,
            Permission::TASKS_COMMENT->value,
            Permission::TASKS_ATTACH_FILES->value,
            Permission::PUBLICATIONS_VIEW_LIST->value,
            Permission::PUBLICATIONS_VIEW_DETAIL->value,
            Permission::PUBLICATIONS_SUBMIT->value,
            Permission::PUBLICATIONS_EDIT_OWN->value,
            Permission::PUBLICATIONS_DELETE_OWN->value,
            Permission::PUBLICATIONS_EXPORT_BIBTEX->value,
            Permission::PUBLICATIONS_EXPORT_APA->value,
            Permission::PUBLICATIONS_AI_ANALYZE->value,
            Permission::CALENDAR_VIEW->value,
            Permission::CALENDAR_CREATE_MEETING->value,
            Permission::CALENDAR_EDIT_OWN_MEETING->value,
            Permission::CALENDAR_JOIN_VIDEO_CALL->value,
            Permission::CALENDAR_START_VIDEO_CALL->value,
            Permission::CALENDAR_VIEW_MINUTES->value,
            Permission::CALENDAR_INVITE_PARTICIPANTS->value,
            Permission::MESSAGES_SEND_DIRECT->value,
            Permission::MESSAGES_SEND_GROUP->value,
            Permission::MESSAGES_DELETE_OWN->value,
            Permission::MESSAGES_VIEW_HISTORY->value,
            Permission::NOTIFICATIONS_VIEW->value,
            Permission::NOTIFICATIONS_MARK_READ->value,
            Permission::NOTIFICATIONS_DELETE->value,
            Permission::AI_USE_CHAT_ASSISTANT->value,
            Permission::AI_ANALYZE_PUBLICATION->value,
            Permission::AI_SUMMARIZE_MEETING->value,
            Permission::AI_VIEW_ANALYSES->value,
            Permission::USERS_VIEW_PROFILE->value,
        ];

        $map = [
            'researcher' => [
                'name'  => 'Chercheur (défaut)',
                'color' => '#0891b2',
                'perms' => $researcherPerms,
            ],
            'team_lead' => [
                'name'  => 'Chef d\'équipe (défaut)',
                'color' => '#7c3aed',
                'perms' => array_merge($researcherPerms, [
                    Permission::PROJECTS_CREATE->value,
                    Permission::PROJECTS_EDIT->value,
                    Permission::PROJECTS_MANAGE_MEMBERS->value,
                    Permission::PROJECTS_VIEW_STATS->value,
                    Permission::PROJECTS_MANAGE_MILESTONES->value,
                    Permission::PROJECTS_MANAGE_TASKS->value,
                    Permission::PROJECTS_VIEW_BUDGET->value,
                    Permission::PROJECTS_EXPORT_REPORT->value,
                    Permission::TASKS_EDIT_ANY->value,
                    Permission::TASKS_DELETE_ANY->value,
                    Permission::TASKS_ASSIGN->value,
                    Permission::TASKS_VALIDATE->value,
                    Permission::TASKS_VIEW_ALL_MEMBERS->value,
                    Permission::PUBLICATIONS_EDIT_ANY->value,
                    Permission::PUBLICATIONS_REVIEW->value,
                    Permission::CALENDAR_EDIT_ANY_MEETING->value,
                    Permission::CALENDAR_DELETE_MEETING->value,
                    Permission::CALENDAR_EDIT_MINUTES->value,
                    Permission::CALENDAR_AI_SUMMARIZE->value,
                    Permission::MESSAGES_CREATE_CHANNEL->value,
                    Permission::MESSAGES_DELETE_ANY->value,
                    Permission::USERS_VIEW_LIST->value,
                ]),
            ],
            'institution' => [
                'name'  => 'Institution (défaut)',
                'color' => '#059669',
                'perms' => [
                    Permission::PROJECTS_VIEW_LIST->value,
                    Permission::PROJECTS_VIEW_DETAIL->value,
                    Permission::PROJECTS_VIEW_STATS->value,
                    Permission::PROJECTS_APPROVE->value,
                    Permission::PROJECTS_REJECT->value,
                    Permission::PUBLICATIONS_VIEW_LIST->value,
                    Permission::PUBLICATIONS_VIEW_DETAIL->value,
                    Permission::PUBLICATIONS_REVIEW->value,
                    Permission::PUBLICATIONS_EXPORT_BIBTEX->value,
                    Permission::PUBLICATIONS_EXPORT_APA->value,
                    Permission::CALENDAR_VIEW->value,
                    Permission::CALENDAR_VIEW_MINUTES->value,
                    Permission::USERS_VIEW_LIST->value,
                    Permission::USERS_VIEW_PROFILE->value,
                    Permission::USERS_VIEW_ACTIVITY->value,
                    Permission::NOTIFICATIONS_VIEW->value,
                    Permission::NOTIFICATIONS_MARK_READ->value,
                    Permission::AI_VIEW_ANALYSES->value,
                ],
            ],
        ];

        if (!isset($map[$spatieRole])) {
            return null;
        }

        $cfg  = $map[$spatieRole];
        $role = CustomRole::create([
            'uuid'        => (string) Str::uuid(),
            'admin_id'    => $admin->id,
            'name'        => $cfg['name'],
            'slug'        => $slug,
            'color'       => $cfg['color'],
            'description' => 'Rôle par défaut assigné automatiquement.',
            'is_system'   => true,
        ]);

        foreach (array_unique($cfg['perms']) as $key) {
            CustomRolePermission::create(['role_id' => $role->id, 'permission_key' => $key]);
        }

        return $role;
    }

    /**
     * Génère un identifiant ORCID unique (ISO 7064 MOD 11-2).
     */
    protected function generateOrcid(): string
    {
        do {
            $digits = [];
            for ($i = 0; $i < 15; $i++) {
                $digits[] = random_int(0, 9);
            }
            $total = 0;
            foreach ($digits as $digit) {
                $total = ($total + $digit) * 2;
            }
            $remainder = 12 - ($total % 11);
            $checksum  = match (true) {
                $remainder === 10 => 'X',
                $remainder === 11 => '0',
                default           => (string) $remainder,
            };
            $orcid = implode('-', str_split(implode('', $digits) . $checksum, 4));
        } while (User::withTrashed()->where('orcid', $orcid)->exists());

        return $orcid;
    }
}
