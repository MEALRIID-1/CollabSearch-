<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Modèle Journal d'activité - CollabSearch
 * 
 * Enregistre toutes les actions importantes réalisées dans le système
 * pour le suivi et l'audit des activités de recherche.
 */
class ActivityLog extends Model
{
    use HasFactory;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'user_id',
        'project_id',
        'action',
        'description',
        'subject_type',
        'subject_id',
        'properties',
        'ip_address',
        'user_agent',
    ];

    /**
     * Casts de type d'attribut
     */
    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Constantes d'action
    |--------------------------------------------------------------------------
    */

    public const ACTION_CREATE = 'create';
    public const ACTION_UPDATE = 'update';
    public const ACTION_DELETE = 'delete';
    public const ACTION_LOGIN = 'login';
    public const ACTION_LOGOUT = 'logout';
    public const ACTION_STATUS_CHANGE = 'status_change';
    public const ACTION_ASSIGN = 'assign';
    public const ACTION_COMMENT = 'comment';
    public const ACTION_UPLOAD = 'upload';
    public const ACTION_EXPORT = 'export';

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Utilisateur ayant effectué l'action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Projet associé à l'action
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Sujet de l'action (polymorphique)
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}
