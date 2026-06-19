<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modèle Pièce jointe - CollabSearch
 * 
 * Représente un fichier attaché à une tâche du projet.
 */
class Attachment extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'task_id',
        'message_id',
        'user_id',
        'filename',
        'original_name',
        'mime_type',
        'media_type',
        'size',
        'path',
        'link_url',
        'is_encrypted',
        'signature',
        'iv',
    ];

    /**
     * Casts de type d'attribut
     */
    protected $casts = [
        'size' => 'integer',
        'is_encrypted' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Tâche parente de la pièce jointe
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Message associé à la pièce jointe
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Utilisateur ayant téléversé la pièce jointe
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accesseurs
    |--------------------------------------------------------------------------
    */

    /**
     * Taille lisible du fichier
     */
    public function getReadableSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['o', 'Ko', 'Mo', 'Go'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
