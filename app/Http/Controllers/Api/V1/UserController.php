<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Contrôleur des utilisateurs - CollabSearch
 * 
 * Gère les opérations CRUD sur les utilisateurs.
 * Réservé aux administrateurs et chefs d'équipe.
 */
class UserController extends Controller
{
    /**
     * Liste des utilisateurs
     */
    public function index(Request $request): JsonResponse
    {
        // Authorisation is handled by Sanctum for authenticated users.
        // This endpoint is used by messaging and user search interfaces.

        try {
            $auth = $request->user();

            $users = User::query()
                ->with(['roles', 'customRoles.permissions'])
                // Administrateur : uniquement lui-même + ses utilisateurs gérés
                ->when($auth->hasRole('administrator'), function ($query) use ($auth) {
                    $query->where(function ($q) use ($auth) {
                        $q->where('users.id', $auth->id)
                          ->orWhereHas('adminOwners', function ($sq) use ($auth) {
                              $sq->where('admin_id', $auth->id)
                                 ->where('admin_user_memberships.is_active', true);
                          });
                    });
                })
                ->when($request->get('search'), function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('institution', 'like', "%{$search}%")
                          ->orWhere('specialty', 'like', "%{$search}%");
                    });
                })
                ->when($request->get('role'), function ($query, $role) {
                    $query->whereHas('roles', function ($q) use ($role) {
                        $q->where('name', $role);
                    });
                })
                ->when($request->get('is_active') !== null, function ($query) use ($request) {
                    $query->where('is_active', $request->boolean('is_active'));
                })
                ->orderBy('last_name')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'users' => UserResource::collection($users),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'total' => $users->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des utilisateurs.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher les détails d'un utilisateur
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'user' => new UserResource($user->load(['roles', 'projects', 'publications'])),
        ]);
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'institution' => 'nullable|string|max:255',
            'specialty' => 'nullable|string|max:255',
            'orcid' => 'nullable|string|max:19',
            'is_active' => 'sometimes|boolean',
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::in(['administrator', 'team_lead', 'researcher', 'institution'])],
        ]);

        try {
            $updateData = $validated;
            unset($updateData['roles']);

            $user->update($updateData);

            if (isset($validated['roles'])) {
                $user->syncRoles($validated['roles']);
            }

            return response()->json([
                'message' => 'Utilisateur mis à jour avec succès.',
                'user' => new UserResource($user->fresh()->load('roles')),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'utilisateur.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        try {
            $user->delete();

            return response()->json([
                'message' => 'Utilisateur supprimé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'utilisateur.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
