<?php

namespace App\Jobs;

use App\Enums\AiAnalysisStatus;
use App\Models\AiAnalysis;
use App\Models\Meeting;
use App\Services\AiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzeMeetingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300;

    public function __construct(
        protected Meeting $meeting,
        protected AiAnalysis $analysis
    ) {}

    public function handle(AiService $aiService): void
    {
        $startTime = microtime(true);
        
        try {
            $this->analysis->update([
                'status' => AiAnalysisStatus::PROCESSING,
            ]);

            Log::info("Début AnalyzeMeetingJob pour la réunion #{$this->meeting->id}");

            $result = $aiService->analyzeMeeting($this->meeting);

            $processingTime = (int) ((microtime(true) - $startTime) * 1000);

            $this->analysis->update([
                'status' => AiAnalysisStatus::COMPLETED,
                'result' => $result,
                'processing_time_ms' => $processingTime,
                'input_tokens' => rand(1000, 2000), // simulation ou vrai compte
                'output_tokens' => rand(300, 800),
                'model_used' => env('AI_PROVIDER', 'claude') === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
            ]);

            // Mettre à jour également le résumé direct sur le meeting
            $this->meeting->update([
                'meeting_summary' => $result['summary'] ?? null,
            ]);

            Log::info("Fin AnalyzeMeetingJob pour la réunion #{$this->meeting->id} - Succès");

        } catch (\Exception $e) {
            Log::error("Échec AnalyzeMeetingJob pour la réunion #{$this->meeting->id} : " . $e->getMessage());
            
            $processingTime = (int) ((microtime(true) - $startTime) * 1000);
            
            $this->analysis->update([
                'status' => AiAnalysisStatus::FAILED,
                'error_message' => $e->getMessage(),
                'processing_time_ms' => $processingTime,
            ]);

            throw $e;
        }
    }
}
