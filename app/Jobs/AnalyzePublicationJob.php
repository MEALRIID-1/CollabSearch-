<?php

namespace App\Jobs;

use App\Enums\AiAnalysisStatus;
use App\Models\AiAnalysis;
use App\Models\Publication;
use App\Services\AiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzePublicationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300;

    public function __construct(
        protected Publication $publication,
        protected AiAnalysis $analysis
    ) {}

    public function handle(AiService $aiService): void
    {
        $startTime = microtime(true);

        try {
            $this->analysis->update([
                'status' => AiAnalysisStatus::PROCESSING,
            ]);

            Log::info("Début AnalyzePublicationJob pour la publication #{$this->publication->id}");

            $result = $aiService->analyzePublication($this->publication);

            $processingTime = (int) ((microtime(true) - $startTime) * 1000);

            // Si des mots-clés ont été extraits, on peut enrichir la publication si vide
            if (empty($this->publication->keywords) && !empty($result['keywords'])) {
                $this->publication->update([
                    'keywords' => $result['keywords'],
                ]);
            }

            $this->analysis->update([
                'status' => AiAnalysisStatus::COMPLETED,
                'result' => $result,
                'processing_time_ms' => $processingTime,
                'input_tokens' => rand(3000, 8000), // simulation
                'output_tokens' => rand(500, 1000),
                'model_used' => env('AI_PROVIDER', 'claude') === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
            ]);

            Log::info("Fin AnalyzePublicationJob pour la publication #{$this->publication->id} - Succès");

        } catch (\Exception $e) {
            Log::error("Échec AnalyzePublicationJob pour la publication #{$this->publication->id} : " . $e->getMessage());

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
