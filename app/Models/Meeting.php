<?php

namespace App\Models;

use App\Enums\MeetingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Modèle Réunion - CollabSearch
 * 
 * Représente une réunion associée à un projet de recherche.
 * Statuts : planifiée, en cours, terminée, annulée
 */
class Meeting extends Model
{
    use HasFactory;

    /**
     * Attributs massivement assignables
     */
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'scheduled_at',
        'ended_at',
        'location',
        'meeting_url',
        'is_online',
        'agenda',
        'minutes',
        'organizer_id',
        'jitsi_room_id',
        'jitsi_jwt_token',
        'recording_url',
        'recording_transcript',
        'meeting_summary',
        'started_at',
        'actual_duration_minutes',
    ];

    /**
     * Casts de type d'attribut
     */
    protected function casts(): array
    {
        return [
            'status' => MeetingStatus::class,
            'scheduled_at' => 'datetime',
            'ended_at' => 'datetime',
            'started_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    /**
     * Projet parent de la réunion
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Organisateur de la réunion
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * Participants invités à la réunion
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'meeting_user')
            ->withPivot('status', 'response_at')
            ->withTimestamps();
    }

    /**
     * Transcription associée à la réunion
     */
    public function transcript(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(MeetingTranscript::class);
    }

    /**
     * Analyses IA de la réunion
     */
    public function analyses(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(AiAnalysis::class, 'analysable');
    }

    /*
    |--------------------------------------------------------------------------
    | Accesseurs
    |--------------------------------------------------------------------------
    */

    /**
     * Durée de la réunion en minutes
     */
    public function getDurationAttribute(): ?int
    {
        if (!$this->ended_at || !$this->scheduled_at) {
            return null;
        }

        return $this->scheduled_at->diffInMinutes($this->ended_at);
    }

    /**
     * Nombre de participants ayant accepté
     */
    public function getAcceptedParticipantsCountAttribute(): int
    {
        return $this->participants()->wherePivot('status', 'accepted')->count();
    }
}
