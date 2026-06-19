<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CustomRole extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'admin_id',
        'name',
        'slug',
        'color',
        'description',
        'is_system',
        'users_count',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'users_count' => 'integer',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::creating(function (CustomRole $role) {
            $role->uuid = $role->uuid ?? (string) Str::uuid();
            $role->slug = $role->slug ?? Str::slug($role->name);
        });

        static::deleting(function (CustomRole $role) {
            if ($role->is_system) {
                abort(403, 'Le rôle système ne peut pas être supprimé.');
            }
        });
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(CustomRolePermission::class, 'role_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_custom_roles',
            'role_id',
            'user_id'
        )
        ->withPivot('assigned_by', 'assigned_at');
    }

    public function getPermissionKeysAttribute(): array
    {
        return $this->permissions->pluck('permission_key')->toArray();
    }

    public function scopeForAdmin($query, int $adminId)
    {
        return $query->where('admin_id', $adminId);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }
}
