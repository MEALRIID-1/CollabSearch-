<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Liaison entre un administrateur et un utilisateur de son espace.
 */
class AdminUserMembership extends Model
{
    use HasFactory;

    protected $table = 'admin_user_memberships';

    protected $fillable = [
        'admin_id',
        'user_id',
        'origin',
        'is_active',
    ];

    public $timestamps = false;

    protected $casts = [
        'is_active' => 'boolean',
        'added_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
