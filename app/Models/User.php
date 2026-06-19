<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * Modèle Utilisateur - CollabSearch
 * 
 * Représente un utilisateur du système avec ses rôles et permissions.
 * Les rôles disponibles sont : administrator, team_lead, researcher, institution
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'institution',
        'specialty',
        'orcid',
        'avatar',
        'is_active',
        'created_by_admin_id',
        'must_change_password',
    ];

    /**
     * Attributs cachés pour la sérialisation
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts de type d'attribut
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'deleted_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Projets dont l'utilisateur est membre
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Projets dirigés par l'utilisateur (chef d'équipe)
     */
    public function ledProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'lead_id');
    }

    /**
     * Tâches assignées à l'utilisateur
     */
    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    /**
     * Publications créées par l'utilisateur
     */
    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class, 'created_by');
    }

    /**
     * Réunions auxquelles l'utilisateur participe
     */
    public function meetings(): BelongsToMany
    {
        return $this->belongsToMany(Meeting::class, 'meeting_user')
            ->withPivot('status', 'response_at')
            ->withTimestamps();
    }

    /**
     * Messages envoyés par l'utilisateur
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Journal d'activité de l'utilisateur
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Commentaires de tâche de l'utilisateur
     */
    public function taskComments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    /**
     * Conversations de groupe auxquelles l'utilisateur participe
     */
    public function groupConversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants');
    }

    /**
     * Conversations IA de l'utilisateur
     */
    public function aiConversations(): HasMany
    {
        return $this->hasMany(AiConversation::class);
    }

    /**
     * Préférences IA enregistrées par l'utilisateur
     */
    public function aiMemory(): HasMany
    {
        return $this->hasMany(AiMemory::class);
    }

    /**
     * Contextes IA de l'utilisateur
     */
    public function aiContexts(): HasMany
    {
        return $this->hasMany(AiContext::class);
    }

    /**
     * Utilisateurs que cet admin a créés ou invités
     */
    public function managedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'admin_user_memberships',
            'admin_id',
            'user_id'
        )
        ->withPivot('origin', 'is_active', 'added_at')
        ->wherePivot('is_active', true);
    }

    /**
     * Admins qui gèrent cet utilisateur
     */
    public function adminOwners(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'admin_user_memberships',
            'user_id',
            'admin_id'
        )
        ->withPivot('origin', 'is_active', 'added_at');
    }

    /**
     * Rôles personnalisés assignés à cet utilisateur
     */
    public function customRoles(): BelongsToMany
    {
        return $this->belongsToMany(
            CustomRole::class,
            'user_custom_roles',
            'user_id',
            'role_id'
        )
        ->withPivot('assigned_by', 'assigned_at');
    }

    /**
     * Admin créateur direct de ce compte
     */
    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }

    /**
     * Utilisateurs créés directement par cet admin
     */
    public function createdUsers(): HasMany
    {
        return $this->hasMany(User::class, 'created_by_admin_id');
    }

    /**
     * Workspace de cet admin
     */
    public function workspace(): HasOne
    {
        return $this->hasOne(AdminWorkspace::class, 'admin_id');
    }

    /**
     * Scope : récupérer uniquement les users visibles par un admin
     */
    public function scopeVisibleByAdmin(Builder $query, int $adminId): Builder
    {
        return $query->whereHas('adminOwners', function ($q) use ($adminId) {
            $q->where('admin_id', $adminId)
              ->where('admin_user_memberships.is_active', true);
        });
    }

    /**
     * Vérifie si un utilisateur est géré par un administrateur donné.
     */
    public function isManagedBy(int $adminId): bool
    {
        return $this->adminOwners()
            ->where('admin_id', $adminId)
            ->wherePivot('is_active', true)
            ->exists();
    }

    /**
     * Vérifier si l'utilisateur a une permission via ses rôles custom
     */
    public function hasCustomPermission(string $permissionKey, int $adminId): bool
    {
        return $this->customRoles()
            ->where('admin_id', $adminId)
            ->whereHas('permissions', fn($q) =>
                $q->where('permission_key', $permissionKey)
            )->exists();
    }

    /**
     * Récupérer toutes les permissions de l'utilisateur pour un admin donné
     */
    public function getCustomPermissions(int $adminId): array
    {
        return $this->customRoles()
            ->where('admin_id', $adminId)
            ->with('permissions')
            ->get()
            ->flatMap(fn($role) => $role->permission_keys)
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Helper : cet utilisateur est-il un admin ?
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('administrator');
    }

    /*
    |--------------------------------------------------------------------------
    | Accesseurs
    |--------------------------------------------------------------------------
    */

    /**
     * Nom complet de l'utilisateur
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Initiales de l'utilisateur
     */
    public function getInitialsAttribute(): string
    {
        return strtoupper(substr($this->first_name, 0, 1) . substr($this->last_name, 0, 1));
    }
}
