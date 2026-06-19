<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomRolePermission extends Model
{
    use HasFactory;

    protected $table = 'custom_role_permissions';
    public $timestamps = false;

    protected $fillable = [
        'role_id',
        'permission_key',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(CustomRole::class, 'role_id');
    }
}
