<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Contrôleur d'authentification - CollabSearch
 * 
 * Gère l'inscription, la connexion, la déconnexion et la
 * gestion du profil utilisateur avec Sanctum.
 */
class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {}

    /**
     * Connexion d'un utilisateur
     * 
     * Authentifie un utilisateur et crée une session Sanctum.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login($request->validated());

            if (!$result) {
                return response()->json([
                    'message' => 'Identifiants invalides.',
                    'errors' => [
                        'email' => ['Les identifiants fournis sont incorrects.'],
                    ],
                ], 401);
            }

            $result['user']->load(['roles', 'projects', 'customRoles.permissions']);

            return response()->json([
                'message' => 'Connexion réussie.',
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la connexion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Inscription d'un nouvel utilisateur
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->register($request->validated());

            $result['user']->load(['roles', 'projects', 'customRoles.permissions']);

            return response()->json([
                'message' => 'Inscription réussie. Bienvenue sur CollabSearch !',
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'inscription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Déconnexion de l'utilisateur
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Si l'utilisateur est authentifié via session/token, utiliser le service
            if ($user) {
                $this->authService->logout($user);

                return response()->json([
                    'message' => 'Déconnexion réussie.',
                ]);
            }

            // Sinon tenter de révoquer le token envoyé en Bearer header ou en cookie
            $plainToken = $request->bearerToken() ?? $request->input('token') ?? $request->cookie('collabsearch_token');

            if ($plainToken) {
                if (class_exists(\Laravel\Sanctum\PersonalAccessToken::class)) {
                    $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($plainToken);

                    if ($tokenModel) {
                        $tokenModel->delete();

                        return response()->json([
                            'message' => 'Déconnexion réussie (token révoqué).',
                        ]);
                    }
                }
            }

            return response()->json([
                'message' => 'Aucun jeton trouvé pour la déconnexion.',
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la déconnexion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rafraîchir le jeton d'authentification
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $token = $this->authService->refresh($request->user());

            return response()->json([
                'message' => 'Jeton rafraîchi avec succès.',
                'token' => $token,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du rafraîchissement du jeton.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir le profil de l'utilisateur connecté
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load(['roles', 'projects', 'customRoles.permissions'])),
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur connecté
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = $this->authService->updateProfile($request->user(), $request->validated());

            return response()->json([
                'message' => 'Profil mis à jour avec succès.',
                'user' => new UserResource($user),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du profil.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Changer le mot de passe de l'utilisateur connecté
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $changed = $this->authService->changePassword(
                $request->user(),
                $request->validated()
            );

            if (!$changed) {
                return response()->json([
                    'message' => 'Mot de passe actuel incorrect.',
                ], 422);
            }

            return response()->json([
                'message' => 'Mot de passe modifié avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du changement de mot de passe.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
