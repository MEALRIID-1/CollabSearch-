<?php

namespace App\Jobs;

use App\Models\Project;
use App\Services\ReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Tâche de génération de rapport de projet - CollabSearch
 * 
 * Génère un rapport de projet de manière asynchrone
 * et le stocke dans le système de fichiers.
 */
class GenerateProjectReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Nombre de tentatives en cas d'échec */
    public int $tries = 3;

    /** Délai d'attente (secondes) */
    public int $timeout = 300;

    /**
     * Créer une nouvelle instance de la tâche
     */
    public function __construct(
        public readonly int $projectId,
        public readonly string $format = 'json',
        public readonly ?int $userId = null,
    ) {}

    /**
     * Exécuter la tâche
     */
    public function handle(ReportService $reportService): void
    {
        try {
            $report = $reportService->generateProjectReport($this->projectId, $this->format);

            $filename = "reports/project_{$this->projectId}_" . now()->format('YmdHis') . ".{$this->format}";
            $content = $this->format === 'json' 
                ? json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) 
                : $this->arrayToCsv($report);

            Storage::put($filename, $content);

            Log::info("Rapport de projet généré avec succès", [
                'project_id' => $this->projectId,
                'filename' => $filename,
                'user_id' => $this->userId,
            ]);
        } catch (\Exception $e) {
            Log::error("Échec de la génération du rapport de projet", [
                'project_id' => $this->projectId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Convertir un tableau en CSV (simplifié)
     */
    private function arrayToCsv(array $data): string
    {
        $lines = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $lines[] = "{$key}:";
                foreach ($value as $subKey => $subValue) {
                    $val = is_array($subValue) ? json_encode($subValue) : $subValue;
                    $lines[] = "  {$subKey}: {$val}";
                }
            } else {
                $lines[] = "{$key}: {$value}";
            }
        }
        return implode("\n", $lines);
    }

    /**
     * Gérer l'échec de la tâche
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Tâche de rapport échouée définitivement", [
            'project_id' => $this->projectId,
            'error' => $exception->getMessage(),
        ]);
    }
}
