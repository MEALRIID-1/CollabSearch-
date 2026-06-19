<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiMessage extends Model
{
    protected $fillable = [
        'ai_conversation_id',
        'role',
        'content',
        'reasoning',
        'confidence_score',
        'sources',
        'metadata',
        'tokens_used',
        'is_clarification',
        'clarification_question',
    ];

    protected $casts = [
        'sources'            => 'array',
        'metadata'           => 'array',
        'confidence_score'   => 'float',
        'is_clarification'   => 'boolean',
        'tokens_used'        => 'integer',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'ai_conversation_id');
    }
}
