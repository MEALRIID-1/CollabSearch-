<?php

namespace App\Jobs;

use App\Models\AiAnalysis;
use App\Models\Meeting;
use App\Models\MeetingTranscript;
use App\Services\TranscriptionService;
use App\Enums\AiAnalysisType;
use App\Enums\AiAnalysisStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TranscribeMeetingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 600;

    public function __construct(
        protected Meeting $meeting,
        protected string $recordingUrl,
        protected int $requestedByUserId
    ) {}

    public function handle(TranscriptionService $transcriptionService): void
    {
        try {
            Log::info("Début TranscribeMeetingJob pour la réunion #{$this->meeting->id}");

            $text = $transcriptionService->transcribeFromJitsiRecording($this->recordingUrl);

            if (empty($text)) {
                Log::warning("Transcription vide pour la réunion #{$this->meeting->id}");
                return;
            }

            // Enregistrer la transcription
            $transcript = MeetingTranscript::updateOrCreate(
                ['meeting_id' => $this->meeting->id],
                [
                    'raw_transcript' => $text,
                    'formatted_transcript' => $text,
                    'language' => 'fr',
                    'duration_seconds' => $this->meeting->actual_duration_minutes ? ($this->meeting->actual_duration_minutes * 60) : null,
                ]
            );

            // Mettre à jour aussi sur le meeting pour compatibilité ascendante
            $this->meeting->update([
                'recording_transcript' => $text,
            ]);

            Log::info("Transcription enregistrée pour la réunion #{$this->meeting->id}. Lancement automatique de l'analyse.");

            // Créer une analyse IA pour la réunion
            $analysis = AiAnalysis::create([
                'analysable_type' => Meeting::class,
                'analysable_id' => $this->meeting->id,
                'requested_by' => $this->requestedByUserId,
                'type' => AiAnalysisType::MEETING_SUMMARY,
                'status' => AiAnalysisStatus::PENDING,
            ]);

            // Lancer l'analyse
            AnalyzeMeetingJob::dispatch($this->meeting, $analysis);

        } catch (\Exception $e) {
            Log::error("Échec TranscribeMeetingJob pour la réunion #{$this->meeting->id} : " . $e->getMessage());
            throw $e;
        }
    }
}
