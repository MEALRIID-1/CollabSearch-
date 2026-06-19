<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingTranscript extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'raw_transcript',
        'formatted_transcript',
        'language',
        'duration_seconds',
    ];

    /**
     * Obtenir la réunion associée.
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }
}
