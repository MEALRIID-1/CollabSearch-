<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle Commentaire de tâche - CollabSearch
 * 
 * Représente un commentaire ajouté à une tâche par un membre
 * de l'équipe de recherche.
 */
class TaskComment extends Model
{
    use HasFactory;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'task_id',
        'user_id',
        'content',
    ];

    /**
     * Casts de type d'attribut
     */
    protected function casts(): array
    {
        return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Tâche parente du commentaire
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Auteur du commentaire
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
