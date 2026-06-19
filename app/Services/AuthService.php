<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\AdminWorkspace;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Service d'authentification - CollabSearch
 * 
 * Gère l'inscription, la connexion, la déconnexion et
 * la gestion du profil utilisateur avec Sanctum.
 */
class AuthService
{
    /**
     * Connecter un utilisateur
     */
    public function login(array $credentials): ?array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return null;
        }

        if (!$user->is_active) {
            return null;
        }

        // Limiter à 5 tokens actifs — supprime le plus ancien si nécessaire
        if ($user->tokens()->count() >= 5) {
            $user->tokens()->oldest()->first()?->delete();
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Enregistrer l'activité
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => ActivityLog::ACTION_LOGIN,
            'description' => 'Connexion réussie',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Inscrire un nouvel utilisateur
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $role = User::whereHas('roles', fn ($query) => $query->where('name', 'administrator'))->exists()
                ? 'researcher'
                : 'administrator';

            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'institution' => $data['institution'] ?? null,
                'specialty' => $data['specialty'] ?? null,
                'orcid' => $data['orcid'] ?? null,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            // Assigner le rôle par défaut
            $user->assignRole($role);

            if ($role === 'administrator') {
                AdminWorkspace::create([
                    'admin_id' => $user->id,
                    'workspace_name' => sprintf('%s %s Workspace', $user->first_name, $user->last_name),
                ]);

                // Créer le rôle système personnalisé
                $customRole = \App\Models\CustomRole::create([
                    'uuid'        => (string) \Illuminate\Support\Str::uuid(),
                    'admin_id'    => $user->id,
                    'name'        => 'Administrateur',
                    'slug'        => 'administrator',
                    'color'       => '#2563EB',
                    'description' => 'Accès complet à toutes les fonctionnalités.',
                    'is_system'   => true,
                ]);

                // Associer toutes les permissions
                $allPermissions = \App\Enums\Permission::allKeys();
                $records = array_map(fn($key) => [
                    'role_id' => $customRole->id,
                    'permission_key' => $key,
                ], $allPermissions);

                DB::table('custom_role_permissions')->insert($records);

                // Assigner à l'admin
                DB::table('user_custom_roles')->insert([
                    'user_id' => $user->id,
                    'role_id' => $customRole->id,
                    'assigned_by' => $user->id,
                    'assigned_at' => now(),
                ]);

                $customRole->updateQuietly(['users_count' => 1]);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            // Enregistrer l'activité
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => ActivityLog::ACTION_CREATE,
                'description' => 'Inscription sur CollabSearch',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return [
                'user' => $user,
                'token' => $token,
            ];
        });
    }

    /**
     * Déconnecter l'utilisateur
     */
    public function logout(User $user): void
    {
        // Supprimer le jeton actuel
        $user->currentAccessToken()->delete();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => ActivityLog::ACTION_LOGOUT,
            'description' => 'Déconnexion',
        ]);
    }

    /**
     * Rafraîchir le jeton d'authentification
     */
    public function refresh(User $user): string
    {
        $user->currentAccessToken()->delete();
        return $user->createToken('auth-token')->plainTextToken;
    }

    /**
     * Mettre à jour le profil utilisateur
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    /**
     * Changer le mot de passe de l'utilisateur
     */
    public function changePassword(User $user, array $data): bool
    {
        if (!Hash::check($data['current_password'], $user->password)) {
            return false;
        }

        $user->update([
            'password' => Hash::make($data['password']),
        ]);

        return true;
    }
}
