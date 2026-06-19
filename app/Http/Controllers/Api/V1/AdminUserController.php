<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\InviteAdminUserRequest;
use App\Http\Requests\StoreAdminUserRequest;
use App\Http\Requests\UpdateAdminUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur de gestion des utilisateurs administrés.
 */
class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminUserService $adminUserService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->adminUserService->listUsers($request->user(), $request->only([
            'search',
            'custom_role_uuid',
            'is_active',
            'per_page',
        ]));

        return response()->json([
            'users' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        $result = $this->adminUserService->createMember($request->user(), $request->validated());

        return response()->json([
            'message' => 'Utilisateur créé avec succès.',
            'user' => new UserResource($result['user']),
            'password' => $request->filled('password') ? null : $result['password'],
        ], 201);
    }

    public function invite(InviteAdminUserRequest $request): JsonResponse
    {
        $result = $this->adminUserService->inviteMember($request->user(), $request->validated());

        return response()->json([
            'message' => 'Invitation envoyée. L\'utilisateur peut se connecter avec son mot de passe temporaire.',
            'user' => new UserResource($result['user']),
            'temporary_password' => $result['password'],
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorizeManagedUser($user);

        return response()->json([
            'user' => new UserResource($user->load(['roles', 'projects', 'publications'])),
        ]);
    }

    public function trashed(Request $request): JsonResponse
    {
        $users = $this->adminUserService->listDeletedUsers($request->user(), $request->only([
            'search',
            'per_page',
        ]));

        return response()->json([
            'users' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function update(UpdateAdminUserRequest $request, User $user): JsonResponse
    {
        $this->authorizeManagedUser($user);

        $updated = $this->adminUserService->updateMember($request->user(), $user, $request->validated());

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès.',
            'user' => new UserResource($updated),
        ]);
    }

    public function restore(Request $request, $userId): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($userId);
        $restored = $this->adminUserService->restoreMember($request->user(), $user);

        return response()->json([
            'message' => 'Utilisateur restauré avec succès.',
            'user' => new UserResource($restored),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeManagedUser($user);

        $this->adminUserService->removeMember($request->user(), $user);

        return response()->json([
            'message' => 'Utilisateur supprimé de votre espace de travail.',
        ]);
    }

    protected function authorizeManagedUser(User $user): void
    {
        if (!$user->isManagedBy(request()->user()->id)) {
            abort(403, 'Vous n\'êtes pas autorisé à accéder à cet utilisateur.');
        }
    }
}
