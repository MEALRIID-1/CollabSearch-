<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignRoleRequest;
use App\Http\Requests\StoreCustomRoleRequest;
use App\Http\Requests\SyncRolePermissionsRequest;
use App\Http\Requests\UpdateCustomRoleRequest;
use App\Http\Resources\CustomRoleDetailResource;
use App\Http\Resources\CustomRoleResource;
use App\Models\CustomRole;
use App\Models\User;
use App\Services\CustomRoleService;
use App\Services\PermissionCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CustomRoleController extends Controller
{
    public function __construct(
        private readonly CustomRoleService $customRoleService,
        private readonly PermissionCatalogService $permissionCatalogService,
    ) {}

    /**
     * GET /api/v1/roles/permissions/catalog
     * Catalogue des permissions système groupées par module (mis en cache 24h).
     */
    public function permissionsCatalog(): JsonResponse
    {
        $catalog = Cache::store('file')->remember('permissions_catalog', 86400, function () {
            return $this->permissionCatalogService->getAllPermissions();
        });

        return response()->json(['data' => $catalog]);
    }

    /**
     * GET /api/v1/roles
     * Liste des rôles de l'admin authentifié.
     */
    public function index(Request $request): JsonResponse
    {
        $roles = $this->customRoleService->getRolesForAdmin($request->user());

        return response()->json([
            'data' => CustomRoleResource::collection($roles),
        ]);
    }

    /**
     * POST /api/v1/roles
     */
    public function store(StoreCustomRoleRequest $request): JsonResponse
    {
        $role = $this->customRoleService->createRole(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'message' => 'Rôle créé avec succès.',
            'data'    => new CustomRoleDetailResource($role->load('permissions', 'users')),
        ], 201);
    }

    /**
     * GET /api/v1/roles/{uuid}
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        $role = $this->customRoleService->getRoleWithPermissions($request->user(), $uuid);

        return response()->json([
            'data' => new CustomRoleDetailResource($role),
        ]);
    }

    /**
     * PUT /api/v1/roles/{uuid}
     */
    public function update(UpdateCustomRoleRequest $request, string $uuid): JsonResponse
    {
        $role = CustomRole::where('uuid', $uuid)->firstOrFail();

        $updated = $this->customRoleService->updateRole(
            $request->user(),
            $role,
            $request->validated()
        );

        return response()->json([
            'message' => 'Rôle mis à jour avec succès.',
            'data'    => new CustomRoleDetailResource($updated->load('permissions', 'users')),
        ]);
    }

    /**
     * PUT /api/v1/roles/{uuid}/permissions
     */
    public function syncPermissions(SyncRolePermissionsRequest $request, string $uuid): JsonResponse
    {
        $role = CustomRole::where('uuid', $uuid)->firstOrFail();

        $updated = $this->customRoleService->syncPermissions(
            $request->user(),
            $role,
            $request->validated('permissions')
        );

        return response()->json([
            'message' => 'Permissions enregistrées avec succès.',
            'data'    => new CustomRoleDetailResource($updated->load('permissions', 'users')),
        ]);
    }

    /**
     * DELETE /api/v1/roles/{uuid}
     * Query param optionnel : ?replacement_uuid=xxx
     */
    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $role = CustomRole::where('uuid', $uuid)->firstOrFail();

        $this->customRoleService->deleteRole(
            $request->user(),
            $role,
            $request->query('replacement_uuid')
        );

        return response()->json(['message' => 'Rôle supprimé avec succès.']);
    }

    /**
     * POST /api/v1/roles/{uuid}/assign
     * Body : { user_uuid: "..." }
     */
    public function assignToUser(AssignRoleRequest $request, string $uuid): JsonResponse
    {
        $role       = CustomRole::where('uuid', $uuid)->firstOrFail();
        $targetUser = User::where('uuid', $request->validated('user_uuid'))->firstOrFail();

        $this->customRoleService->assignRoleToUser($request->user(), $targetUser, $role);

        return response()->json(['message' => 'Rôle attribué à l\'utilisateur.']);
    }

    /**
     * DELETE /api/v1/roles/users/{userUuid}/unassign
     */
    public function removeFromUser(Request $request, string $userUuid): JsonResponse
    {
        $targetUser = User::where('uuid', $userUuid)->firstOrFail();

        $this->customRoleService->removeRoleFromUser($request->user(), $targetUser);

        return response()->json(['message' => 'Rôle retiré de l\'utilisateur.']);
    }
}
