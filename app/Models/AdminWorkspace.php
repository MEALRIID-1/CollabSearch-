<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Représente l'espace de travail d'un administrateur.
 */
class AdminWorkspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'admin_id',
        'workspace_name',
    ];

    protected $casts = [
        'uuid' => 'string',
    ];

    protected static function booted(): void
    {
        static::creating(function (AdminWorkspace $workspace) {
            if (empty($workspace->uuid)) {
                $workspace->uuid = (string) Str::uuid();
            }
        });
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
