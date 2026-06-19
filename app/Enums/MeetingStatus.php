<?php

namespace App\Enums;

/**
 * Énumération des statuts de réunion
 */
enum MeetingStatus: string
{
    case SCHEDULED = 'scheduled';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    /**
     * Retourne le libellé en français du statut
     */
    public function label(): string
    {
        return match ($this) {
            self::SCHEDULED => 'Planifiée',
            self::IN_PROGRESS => 'En cours',
            self::COMPLETED => 'Terminée',
            self::CANCELLED => 'Annulée',
        };
    }

    /**
     * Retourne la couleur associée au statut
     */
    public function color(): string
    {
        return match ($this) {
            self::SCHEDULED => 'blue',
            self::IN_PROGRESS => 'green',
            self::COMPLETED => 'gray',
            self::CANCELLED => 'red',
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
