<?php

namespace App\Enums;

/**
 * Énumération des types d'analyses d'intelligence artificielle
 */
enum AiAnalysisType: string
{
    case MEETING_SUMMARY = 'meeting_summary';
    case PUBLICATION_ANALYSIS = 'publication_analysis';
    case KEYWORD_EXTRACTION = 'keyword_extraction';
    case SENTIMENT_ANALYSIS = 'sentiment_analysis';
    case SIMILARITY_CHECK = 'similarity_check';

    /**
     * Retourne le libellé en français du type d'analyse
     */
    public function label(): string
    {
        return match ($this) {
            self::MEETING_SUMMARY => 'Résumé de réunion',
            self::PUBLICATION_ANALYSIS => 'Analyse de publication',
            self::KEYWORD_EXTRACTION => 'Extraction de mots-clés',
            self::SENTIMENT_ANALYSIS => 'Analyse de sentiment',
            self::SIMILARITY_CHECK => 'Vérification de similarité',
        };
    }

    /**
     * Retourne tous les types sous forme de tableau
     */
    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }
}
