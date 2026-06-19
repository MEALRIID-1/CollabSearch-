<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle ChatChannelMember - CollabSearch
 *
 * Représente l'appartenance d'un utilisateur à un canal de chat.
 */
class ChatChannelMember extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $table = 'chat_channel_members';

    protected $primaryKey = null;

    public $timestamps = false;

    protected $fillable = [
        'channel_id',
        'user_id',
        'last_read_at',
        'joined_at',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
        'joined_at' => 'datetime',
    ];

    public function channel(): BelongsTo
    {
        return $this->belongsTo(ChatChannel::class, 'channel_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
