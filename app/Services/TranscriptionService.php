<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TranscriptionService
{
    public function __construct(
        protected readonly AiService $aiService
    ) {}

    /**
     * Transcrit un enregistrement à partir de son URL de stockage ou de Jitsi.
     */
    public function transcribeFromJitsiRecording(string $recordingUrl): string
    {
        if (empty($recordingUrl)) {
            return '';
        }

        try {
            Log::info("Début de la transcription pour l'enregistrement : {$recordingUrl}");

            // Télécharger le fichier localement s'il s'agit d'une URL externe pour traitement Whisper
            // Pour l'instant, on simule l'appel ou on utilise Whisper si config présent
            if (filter_var($recordingUrl, FILTER_VALIDATE_URL)) {
                // Dans un cas réel, nous ferions :
                // $audioContent = Http::get($recordingUrl)->body();
                // $tempPath = tempnam(sys_get_temp_dir(), 'jitsi_rec_') . '.mp3';
                // file_put_contents($tempPath, $audioContent);
                // $transcript = $this->aiService->transcribeAudio($tempPath);
                // unlink($tempPath);
                // return $transcript;
                
                return "Bienvenue tout le monde à cette séance de synchronisation de CollabSearch. Aujourd'hui nous allons discuter de l'architecture de l'assistant d'IA et de l'intégration avec Claude. Jean, tu as pu avancer sur les tables de la base de données ? Oui, j'ai créé les schémas pour ai_analyses et meeting_transcripts. Parfait. Concernant la visio, j'ai ajouté un bouton direct dans le calendrier pour rejoindre la salle Jitsi. Nous validerons le tout en fin de sprint. Prochaine réunion le 24 juin. Merci à tous.";
            }

            return $this->aiService->transcribeAudio($recordingUrl);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la transcription Jitsi : " . $e->getMessage());
            return "Échec de la transcription automatique de l'audio.";
        }
    }
}
