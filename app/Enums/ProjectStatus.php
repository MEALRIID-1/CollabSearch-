<?php

namespace App\Enums;

/**
 * Énumération des statuts de projet
 * 
 * Gère le cycle de vie complet d'un projet de recherche :
 * brouillon → soumis → approuvé/rejeté → actif → archivé
 */
enum ProjectStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case ACTIVE = 'active';
    case ARCHIVED = 'archived';

    /**
     * Retourne le libellé en français du statut
     */
    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Brouillon',
            self::SUBMITTED => 'Soumis',
            self::APPROVED => 'Approuvé',
            self::REJECTED => 'Rejeté',
            self::ACTIVE => 'Actif',
            self::ARCHIVED => 'Archivé',
        };
    }

    /**
     * Retourne la couleur associée au statut pour l'affichage
     */
    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'gray',
            self::SUBMITTED => 'yellow',
            self::APPROVED => 'green',
            self::REJECTED => 'red',
            self::ACTIVE => 'blue',
            self::ARCHIVED => 'purple',
        };
    }

    /**
     * Vérifie si la transition vers un autre statut est autorisée
     */
    public function canTransitionTo(self $status): bool
    {
        return match ($this) {
            self::DRAFT => in_array($status, [self::SUBMITTED, self::ARCHIVED]),
            self::SUBMITTED => in_array($status, [self::APPROVED, self::REJECTED, self::DRAFT]),
            self::APPROVED => in_array($status, [self::ACTIVE, self::ARCHIVED]),
            self::REJECTED => in_array($status, [self::DRAFT, self::ARCHIVED]),
            self::ACTIVE => in_array($status, [self::ARCHIVED]),
            self::ARCHIVED => in_array($status, [self::DRAFT]),
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
