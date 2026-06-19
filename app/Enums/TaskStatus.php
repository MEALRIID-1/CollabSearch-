<?php

namespace App\Enums;

/**
 * Énumération des statuts de tâche
 *
 * Gère le cycle de vie d'une tâche dans le tableau Kanban :
 * à faire → en cours → soumis → validé | refusé
 */
enum TaskStatus: string
{
    case TODO = 'todo';
    case IN_PROGRESS = 'in_progress';
    case SUBMITTED = 'submitted';
    case VALIDATED = 'validated';
    case REFUSED = 'refused';

    /**
     * Retourne le libellé en français du statut
     */
    public function label(): string
    {
        return match ($this) {
            self::TODO => 'À faire',
            self::IN_PROGRESS => 'En cours',
            self::SUBMITTED => 'Soumis',
            self::VALIDATED => 'Validé',
            self::REFUSED => 'Refusé',
        };
    }

    /**
     * Retourne la couleur associée au statut
     */
    public function color(): string
    {
        return match ($this) {
            self::TODO => 'gray',
            self::IN_PROGRESS => 'blue',
            self::SUBMITTED => 'amber',
            self::VALIDATED => 'emerald',
            self::REFUSED => 'red',
        };
    }

    /**
     * Vérifie si la transition vers un autre statut est autorisée.
     * VALIDATED et REFUSED sont terminaux.
     * VALIDATED est uniquement accessible via validateTask().
     * Les autres transitions sont libres pour le Kanban.
     */
    public function canTransitionTo(self $status): bool
    {
        if ($this === self::VALIDATED) {
            return false; // tâche validée : terminale
        }
        if ($this === self::REFUSED) {
            // seul retour autorisé : repasser en cours (bouton Refaire)
            return $status === self::IN_PROGRESS;
        }
        if ($status === self::VALIDATED) {
            return false; // VALIDATED uniquement via validateTask()
        }
        return $this !== $status;
    }

    /**
     * Retourne tous les statuts sous forme de tableau
     */
    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }
}
