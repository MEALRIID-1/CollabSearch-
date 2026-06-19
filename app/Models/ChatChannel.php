<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Str;

/**
 * Modèle ChatChannel - CollabSearch
 *
 * Représente un salon de discussion rattaché à un projet ou un canal thématique.
 */
class ChatChannel extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'project_id',
        'name',
        'description',
        'type',
        'created_by',
        'is_archived',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (ChatChannel $channel) {
            if (empty($channel->uuid)) {
                $channel->uuid = (string) Str::uuid();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_channel_members', 'channel_id', 'user_id')
            ->withPivot(['last_read_at', 'joined_at'])
            ->withTimestamps();
    }

    public function channelMembers(): HasMany
    {
        return $this->hasMany(ChatChannelMember::class, 'channel_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'channel_id');
    }
}
