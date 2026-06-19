<?php

namespace App\Models;

use App\Enums\AiAnalysisStatus;
use App\Enums\AiAnalysisType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class AiAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'analysable_type',
        'analysable_id',
        'requested_by',
        'type',
        'status',
        'input_tokens',
        'output_tokens',
        'model_used',
        'result',
        'error_message',
        'processing_time_ms',
    ];

    protected static function booted()
    {
        static::creating(function ($analysis) {
            if (empty($analysis->uuid)) {
                $analysis->uuid = (string) Str::uuid();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'type' => AiAnalysisType::class,
            'status' => AiAnalysisStatus::class,
            'result' => 'array',
        ];
    }

    /**
     * Obtenir le modèle parent (Meeting ou Publication).
     */
    public function analysable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Obtenir l'utilisateur ayant demandé l'analyse.
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
