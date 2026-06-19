<?php

namespace App\Enums;

/**
 * Énumération des types de publication scientifique
 */
enum PublicationType: string
{
    case ARTICLE = 'article';
    case CONFERENCE = 'conference';
    case THESE = 'these';
    case RAPPORT = 'rapport';
    case LIVRE = 'livre';

    /**
     * Retourne le libellé en français du type
     */
    public function label(): string
    {
        return match ($this) {
            self::ARTICLE => 'Article',
            self::CONFERENCE => 'Conférence',
            self::THESE => 'Thèse',
            self::RAPPORT => 'Rapport',
            self::LIVRE => 'Livre',
        };
    }

    /**
     * Retourne l'icône associée au type
     */
    public function icon(): string
    {
        return match ($this) {
            self::ARTICLE => 'document-text',
            self::CONFERENCE => 'presentation-chart-bar',
            self::THESE => 'academic-cap',
            self::RAPPORT => 'clipboard-document',
            self::LIVRE => 'book-open',
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
