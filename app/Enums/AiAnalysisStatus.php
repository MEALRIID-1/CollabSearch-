<?php

namespace App\Enums;

/**
 * Énumération des statuts d'une analyse IA
 */
enum AiAnalysisStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';

    /**
     * Retourne le libellé en français du statut
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'En attente',
            self::PROCESSING => 'En cours de traitement',
            self::COMPLETED => 'Terminée',
            self::FAILED => 'Échouée',
        };
    }

    /**
     * Retourne tous les statuts sous forme de tableau
     */
    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }
}
