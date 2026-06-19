<?php

namespace App\Http\Middleware;

use App\Services\AdminUserService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Vérifie qu'un utilisateur possède une ou plusieurs permissions custom.
 *
 * Usage dans les routes :
 *   ->middleware('custom_permission:projects.view_list')
 *   ->middleware('custom_permission:tasks.create,tasks.edit_own')  // au moins une
 *
 * Les administrateurs (Spatie role = administrator) passent toujours.
 * Si un utilisateur n'a aucun rôle custom, un rôle par défaut est auto-assigné.
 */
class CheckCustomPermission
{
    public function __construct(private readonly AdminUserService $adminUserService) {}

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        // Les admins ont toujours accès
        if ($user->hasRole('administrator')) {
            return $next($request);
        }

        // Charger les permissions custom si pas encore chargées
        if (!$user->relationLoaded('customRoles')) {
            $user->load('customRoles.permissions');
        }

        // Auto-corriger : si l'utilisateur n'a aucun rôle custom, lui assigner le rôle par défaut
        if ($user->customRoles->isEmpty()) {
            $admin = $user->adminOwners()->first();
            $spatieRole = $user->roles->first()?->name ?? 'researcher';
            if ($admin) {
                $defaultRole = $this->adminUserService->getOrCreateDefaultCustomRole($admin, $spatieRole);
                if ($defaultRole) {
                    $this->adminUserService->assignDefaultRoleToUser($admin, $user, $defaultRole);
                    $user->load('customRoles.permissions');
                }
            }
        }

        $userPermissions = $user->customRoles
            ->flatMap(fn ($role) => $role->permissions->pluck('permission_key'))
            ->unique()
            ->all();

        // Vérifier qu'au moins une des permissions requises est présente
        foreach ($permissions as $permission) {
            if (in_array($permission, $userPermissions)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Action non autorisée. Permission manquante : ' . implode(' ou ', $permissions),
        ], 403);
    }
}
