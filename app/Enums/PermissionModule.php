<?php

namespace App\Enums;

enum PermissionModule: string
{
    case PROJECTS = 'projects';
    case TASKS = 'tasks';
    case PUBLICATIONS = 'publications';
    case CALENDAR = 'calendar';
    case USERS = 'users';
    case MESSAGES = 'messages';
    case NOTIFICATIONS = 'notifications';
    case AI = 'ai';
    case ROLES = 'roles';

    public function label(): string
    {
        return match ($this) {
            self::PROJECTS => 'Projets',
            self::TASKS => 'Tâches',
            self::PUBLICATIONS => 'Publications',
            self::CALENDAR => 'Calendrier',
            self::USERS => 'Utilisateurs',
            self::MESSAGES => 'Messages & chat',
            self::NOTIFICATIONS => 'Notifications',
            self::AI => 'Assistant IA',
            self::ROLES => 'Rôles & permissions',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::PROJECTS => 'FolderKanban',
            self::TASKS => 'ClipboardList',
            self::PUBLICATIONS => 'BookOpen',
            self::CALENDAR => 'Calendar',
            self::USERS => 'Users',
            self::MESSAGES => 'MessageSquare',
            self::NOTIFICATIONS => 'Bell',
            self::AI => 'Sparkles',
            self::ROLES => 'ShieldCheck',
        };
    }
}
