<?php

namespace App\Enums;

/**
 * Énumération des catégories budgétaires
 */
enum BudgetCategory: string
{
    case PERSONNEL = 'personnel';
    case MATERIEL = 'materiel';
    case MISSION = 'mission';
    case PUBLICATION = 'publication';
    case AUTRE = 'autre';

    /**
     * Retourne le libellé en français de la catégorie
     */
    public function label(): string
    {
        return match ($this) {
            self::PERSONNEL => 'Personnel',
            self::MATERIEL => 'Matériel',
            self::MISSION => 'Mission',
            self::PUBLICATION => 'Publication',
            self::AUTRE => 'Autre',
        };
    }

    /**
     * Retourne la couleur associée à la catégorie
     */
    public function color(): string
    {
        return match ($this) {
            self::PERSONNEL => 'blue',
            self::MATERIEL => 'orange',
            self::MISSION => 'green',
            self::PUBLICATION => 'purple',
            self::AUTRE => 'gray',
        };
    }

    /**
     * Retourne toutes les catégories sous forme de tableau
     */
    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }
}
