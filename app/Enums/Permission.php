<?php

namespace App\Enums;

enum Permission: string
{
    // MODULE 1 : PROJETS
    case PROJECTS_VIEW_LIST = 'projects.view_list';
    case PROJECTS_VIEW_DETAIL = 'projects.view_detail';
    case PROJECTS_CREATE = 'projects.create';
    case PROJECTS_EDIT = 'projects.edit';
    case PROJECTS_DELETE = 'projects.delete';
    case PROJECTS_ARCHIVE = 'projects.archive';
    case PROJECTS_RESTORE = 'projects.restore';
    case PROJECTS_SUBMIT = 'projects.submit';
    case PROJECTS_APPROVE = 'projects.approve';
    case PROJECTS_REJECT = 'projects.reject';
    case PROJECTS_MANAGE_MEMBERS = 'projects.manage_members';
    case PROJECTS_VIEW_STATS = 'projects.view_stats';
    case PROJECTS_EXPORT_REPORT = 'projects.export_report';
    case PROJECTS_MANAGE_MILESTONES = 'projects.manage_milestones';
    case PROJECTS_MANAGE_TASKS = 'projects.manage_tasks';
    case PROJECTS_VIEW_BUDGET = 'projects.view_budget';
    case PROJECTS_MANAGE_BUDGET = 'projects.manage_budget';

    // MODULE 2 : TÂCHES
    case TASKS_VIEW = 'tasks.view';
    case TASKS_CREATE = 'tasks.create';
    case TASKS_EDIT_ANY = 'tasks.edit_any';
    case TASKS_EDIT_OWN = 'tasks.edit_own';
    case TASKS_DELETE_ANY = 'tasks.delete_any';
    case TASKS_DELETE_OWN = 'tasks.delete_own';
    case TASKS_CHANGE_STATUS = 'tasks.change_status';
    case TASKS_VALIDATE = 'tasks.validate';
    case TASKS_ASSIGN = 'tasks.assign';
    case TASKS_COMMENT = 'tasks.comment';
    case TASKS_ATTACH_FILES = 'tasks.attach_files';
    case TASKS_VIEW_ALL_MEMBERS = 'tasks.view_all_members';

    // MODULE 3 : PUBLICATIONS
    case PUBLICATIONS_VIEW_LIST = 'publications.view_list';
    case PUBLICATIONS_VIEW_DETAIL = 'publications.view_detail';
    case PUBLICATIONS_SUBMIT = 'publications.submit';
    case PUBLICATIONS_EDIT_OWN = 'publications.edit_own';
    case PUBLICATIONS_EDIT_ANY = 'publications.edit_any';
    case PUBLICATIONS_DELETE_OWN = 'publications.delete_own';
    case PUBLICATIONS_DELETE_ANY = 'publications.delete_any';
    case PUBLICATIONS_REVIEW = 'publications.review';
    case PUBLICATIONS_EXPORT_BIBTEX = 'publications.export_bibtex';
    case PUBLICATIONS_EXPORT_APA = 'publications.export_apa';
    case PUBLICATIONS_AI_ANALYZE = 'publications.ai_analyze';

    // MODULE 4 : CALENDRIER & RÉUNIONS
    case CALENDAR_VIEW = 'calendar.view';
    case CALENDAR_CREATE_MEETING = 'calendar.create_meeting';
    case CALENDAR_EDIT_ANY_MEETING = 'calendar.edit_any_meeting';
    case CALENDAR_EDIT_OWN_MEETING = 'calendar.edit_own_meeting';
    case CALENDAR_DELETE_MEETING = 'calendar.delete_meeting';
    case CALENDAR_INVITE_PARTICIPANTS = 'calendar.invite_participants';
    case CALENDAR_JOIN_VIDEO_CALL = 'calendar.join_video_call';
    case CALENDAR_START_VIDEO_CALL = 'calendar.start_video_call';
    case CALENDAR_VIEW_MINUTES = 'calendar.view_minutes';
    case CALENDAR_EDIT_MINUTES = 'calendar.edit_minutes';
    case CALENDAR_AI_SUMMARIZE = 'calendar.ai_summarize';

    // MODULE 5 : UTILISATEURS
    case USERS_VIEW_LIST = 'users.view_list';
    case USERS_VIEW_PROFILE = 'users.view_profile';
    case USERS_CREATE = 'users.create';
    case USERS_EDIT = 'users.edit';
    case USERS_DELETE = 'users.delete';
    case USERS_RESTORE = 'users.restore';
    case USERS_FORCE_DELETE = 'users.force_delete';
    case USERS_TOGGLE_ACTIVE = 'users.toggle_active';
    case USERS_INVITE = 'users.invite';
    case USERS_CHANGE_ROLE = 'users.change_role';
    case USERS_VIEW_ACTIVITY = 'users.view_activity';

    // MODULE 6 : MESSAGES & CHAT
    case MESSAGES_SEND_DIRECT = 'messages.send_direct';
    case MESSAGES_SEND_GROUP = 'messages.send_group';
    case MESSAGES_DELETE_OWN = 'messages.delete_own';
    case MESSAGES_DELETE_ANY = 'messages.delete_any';
    case MESSAGES_SEND_ENCRYPTED_FILE = 'messages.send_encrypted_file';
    case MESSAGES_CREATE_CHANNEL = 'messages.create_channel';
    case MESSAGES_MANAGE_CHANNELS = 'messages.manage_channels';
    case MESSAGES_VIEW_HISTORY = 'messages.view_history';

    // MODULE 7 : NOTIFICATIONS
    case NOTIFICATIONS_VIEW = 'notifications.view';
    case NOTIFICATIONS_MARK_READ = 'notifications.mark_read';
    case NOTIFICATIONS_DELETE = 'notifications.delete';
    case NOTIFICATIONS_MANAGE_ALL = 'notifications.manage_all';
    case NOTIFICATIONS_SEND_MANUAL = 'notifications.send_manual';

    // MODULE 8 : ASSISTANT IA
    case AI_USE_CHAT_ASSISTANT = 'ai.use_chat_assistant';
    case AI_ANALYZE_PUBLICATION = 'ai.analyze_publication';
    case AI_SUMMARIZE_MEETING = 'ai.summarize_meeting';
    case AI_VIEW_ANALYSES = 'ai.view_analyses';
    case AI_DELETE_ANALYSIS = 'ai.delete_analysis';
    case AI_CONFIGURE = 'ai.configure';

    // MODULE 9 : RÔLES & PERMISSIONS
    case ROLES_VIEW = 'roles.view';
    case ROLES_CREATE = 'roles.create';
    case ROLES_EDIT = 'roles.edit';
    case ROLES_DELETE = 'roles.delete';
    case ROLES_ASSIGN_PERMISSIONS = 'roles.assign_permissions';
    case ROLES_ASSIGN_TO_USER = 'roles.assign_to_user';

    public function label(): string
    {
        return match ($this) {
            self::PROJECTS_VIEW_LIST => 'Voir la liste des projets',
            self::PROJECTS_VIEW_DETAIL => 'Voir le détail d\'un projet',
            self::PROJECTS_CREATE => 'Créer un projet',
            self::PROJECTS_EDIT => 'Modifier un projet',
            self::PROJECTS_DELETE => 'Supprimer un projet',
            self::PROJECTS_ARCHIVE => 'Archiver un projet',
            self::PROJECTS_RESTORE => 'Restaurer un projet supprimé',
            self::PROJECTS_SUBMIT => 'Soumettre un projet pour approbation',
            self::PROJECTS_APPROVE => 'Approuver un projet',
            self::PROJECTS_REJECT => 'Rejeter un projet',
            self::PROJECTS_MANAGE_MEMBERS => 'Gérer les membres d\'un projet',
            self::PROJECTS_VIEW_STATS => 'Voir les statistiques d\'un projet',
            self::PROJECTS_EXPORT_REPORT => 'Exporter un rapport PDF de projet',
            self::PROJECTS_MANAGE_MILESTONES => 'Gérer les jalons',
            self::PROJECTS_MANAGE_TASKS => 'Gérer toutes les tâches du projet',
            self::PROJECTS_VIEW_BUDGET => 'Voir le budget',
            self::PROJECTS_MANAGE_BUDGET => 'Gérer les lignes budgétaires',
            self::TASKS_VIEW => 'Voir les tâches',
            self::TASKS_CREATE => 'Créer une tâche',
            self::TASKS_EDIT_ANY => 'Modifier n\'importe quelle tâche',
            self::TASKS_EDIT_OWN => 'Modifier ses propres tâches',
            self::TASKS_DELETE_ANY => 'Supprimer n\'importe quelle tâche',
            self::TASKS_DELETE_OWN => 'Supprimer ses propres tâches',
            self::TASKS_CHANGE_STATUS => 'Changer le statut d\'une tâche',
            self::TASKS_VALIDATE => 'Valider une tâche (statut → validé)',
            self::TASKS_ASSIGN => 'Assigner une tâche à un membre',
            self::TASKS_COMMENT => 'Commenter une tâche',
            self::TASKS_ATTACH_FILES => 'Joindre des fichiers à une tâche',
            self::TASKS_VIEW_ALL_MEMBERS => 'Voir les tâches de tous les membres',
            self::PUBLICATIONS_VIEW_LIST => 'Voir la liste des publications',
            self::PUBLICATIONS_VIEW_DETAIL => 'Voir le détail d\'une publication',
            self::PUBLICATIONS_SUBMIT => 'Soumettre une publication',
            self::PUBLICATIONS_EDIT_OWN => 'Modifier ses propres publications',
            self::PUBLICATIONS_EDIT_ANY => 'Modifier n\'importe quelle publication',
            self::PUBLICATIONS_DELETE_OWN => 'Supprimer ses propres publications',
            self::PUBLICATIONS_DELETE_ANY => 'Supprimer n\'importe quelle publication',
            self::PUBLICATIONS_REVIEW => 'Valider ou rejeter une publication',
            self::PUBLICATIONS_EXPORT_BIBTEX => 'Exporter en BibTeX',
            self::PUBLICATIONS_EXPORT_APA => 'Exporter en format APA',
            self::PUBLICATIONS_AI_ANALYZE => 'Analyser une publication avec l\'IA',
            self::CALENDAR_VIEW => 'Voir le calendrier',
            self::CALENDAR_CREATE_MEETING => 'Créer une réunion',
            self::CALENDAR_EDIT_ANY_MEETING => 'Modifier n\'importe quelle réunion',
            self::CALENDAR_EDIT_OWN_MEETING => 'Modifier ses propres réunions',
            self::CALENDAR_DELETE_MEETING => 'Supprimer une réunion',
            self::CALENDAR_INVITE_PARTICIPANTS => 'Inviter des participants',
            self::CALENDAR_JOIN_VIDEO_CALL => 'Rejoindre une visioconférence',
            self::CALENDAR_START_VIDEO_CALL => 'Démarrer une visioconférence',
            self::CALENDAR_VIEW_MINUTES => 'Voir les comptes-rendus',
            self::CALENDAR_EDIT_MINUTES => 'Rédiger / modifier les comptes-rendus',
            self::CALENDAR_AI_SUMMARIZE => 'Générer un résumé IA de réunion',
            self::USERS_VIEW_LIST => 'Voir la liste des utilisateurs',
            self::USERS_VIEW_PROFILE => 'Voir le profil d\'un utilisateur',
            self::USERS_CREATE => 'Créer un utilisateur',
            self::USERS_EDIT => 'Modifier un utilisateur',
            self::USERS_DELETE => 'Supprimer (soft delete) un utilisateur',
            self::USERS_RESTORE => 'Restaurer un utilisateur supprimé',
            self::USERS_FORCE_DELETE => 'Supprimer définitivement un utilisateur',
            self::USERS_TOGGLE_ACTIVE => 'Activer / désactiver un utilisateur',
            self::USERS_INVITE => 'Inviter un utilisateur existant',
            self::USERS_CHANGE_ROLE => 'Changer le rôle d\'un utilisateur',
            self::USERS_VIEW_ACTIVITY => 'Voir l\'activité d\'un utilisateur',
            self::MESSAGES_SEND_DIRECT => 'Envoyer un message direct',
            self::MESSAGES_SEND_GROUP => 'Envoyer un message de groupe',
            self::MESSAGES_DELETE_OWN => 'Supprimer ses propres messages',
            self::MESSAGES_DELETE_ANY => 'Supprimer n\'importe quel message',
            self::MESSAGES_SEND_ENCRYPTED_FILE => 'Envoyer un fichier chiffré',
            self::MESSAGES_CREATE_CHANNEL => 'Créer un canal de discussion',
            self::MESSAGES_MANAGE_CHANNELS => 'Gérer les canaux (archiver, renommer)',
            self::MESSAGES_VIEW_HISTORY => 'Voir l\'historique complet des messages',
            self::NOTIFICATIONS_VIEW => 'Voir ses notifications',
            self::NOTIFICATIONS_MARK_READ => 'Marquer comme lue',
            self::NOTIFICATIONS_DELETE => 'Supprimer une notification',
            self::NOTIFICATIONS_MANAGE_ALL => 'Gérer les notifications de tous (admin)',
            self::NOTIFICATIONS_SEND_MANUAL => 'Envoyer une notification manuelle',
            self::AI_USE_CHAT_ASSISTANT => 'Utiliser le chatbot assistant',
            self::AI_ANALYZE_PUBLICATION => 'Analyser une publication',
            self::AI_SUMMARIZE_MEETING => 'Résumer une réunion',
            self::AI_VIEW_ANALYSES => 'Voir les analyses existantes',
            self::AI_DELETE_ANALYSIS => 'Supprimer une analyse IA',
            self::AI_CONFIGURE => 'Configurer les paramètres IA (admin)',
            self::ROLES_VIEW => 'Voir les rôles existants',
            self::ROLES_CREATE => 'Créer un rôle',
            self::ROLES_EDIT => 'Modifier un rôle',
            self::ROLES_DELETE => 'Supprimer un rôle',
            self::ROLES_ASSIGN_PERMISSIONS => 'Attribuer des permissions à un rôle',
            self::ROLES_ASSIGN_TO_USER => 'Assigner un rôle à un utilisateur',
        };
    }

    public function module(): PermissionModule
    {
        return match ($this) {
            self::PROJECTS_VIEW_LIST,
            self::PROJECTS_VIEW_DETAIL,
            self::PROJECTS_CREATE,
            self::PROJECTS_EDIT,
            self::PROJECTS_DELETE,
            self::PROJECTS_ARCHIVE,
            self::PROJECTS_RESTORE,
            self::PROJECTS_SUBMIT,
            self::PROJECTS_APPROVE,
            self::PROJECTS_REJECT,
            self::PROJECTS_MANAGE_MEMBERS,
            self::PROJECTS_VIEW_STATS,
            self::PROJECTS_EXPORT_REPORT,
            self::PROJECTS_MANAGE_MILESTONES,
            self::PROJECTS_MANAGE_TASKS,
            self::PROJECTS_VIEW_BUDGET,
            self::PROJECTS_MANAGE_BUDGET => PermissionModule::PROJECTS,

            self::TASKS_VIEW,
            self::TASKS_CREATE,
            self::TASKS_EDIT_ANY,
            self::TASKS_EDIT_OWN,
            self::TASKS_DELETE_ANY,
            self::TASKS_DELETE_OWN,
            self::TASKS_CHANGE_STATUS,
            self::TASKS_VALIDATE,
            self::TASKS_ASSIGN,
            self::TASKS_COMMENT,
            self::TASKS_ATTACH_FILES,
            self::TASKS_VIEW_ALL_MEMBERS => PermissionModule::TASKS,

            self::PUBLICATIONS_VIEW_LIST,
            self::PUBLICATIONS_VIEW_DETAIL,
            self::PUBLICATIONS_SUBMIT,
            self::PUBLICATIONS_EDIT_OWN,
            self::PUBLICATIONS_EDIT_ANY,
            self::PUBLICATIONS_DELETE_OWN,
            self::PUBLICATIONS_DELETE_ANY,
            self::PUBLICATIONS_REVIEW,
            self::PUBLICATIONS_EXPORT_BIBTEX,
            self::PUBLICATIONS_EXPORT_APA,
            self::PUBLICATIONS_AI_ANALYZE => PermissionModule::PUBLICATIONS,

            self::CALENDAR_VIEW,
            self::CALENDAR_CREATE_MEETING,
            self::CALENDAR_EDIT_ANY_MEETING,
            self::CALENDAR_EDIT_OWN_MEETING,
            self::CALENDAR_DELETE_MEETING,
            self::CALENDAR_INVITE_PARTICIPANTS,
            self::CALENDAR_JOIN_VIDEO_CALL,
            self::CALENDAR_START_VIDEO_CALL,
            self::CALENDAR_VIEW_MINUTES,
            self::CALENDAR_EDIT_MINUTES,
            self::CALENDAR_AI_SUMMARIZE => PermissionModule::CALENDAR,

            self::USERS_VIEW_LIST,
            self::USERS_VIEW_PROFILE,
            self::USERS_CREATE,
            self::USERS_EDIT,
            self::USERS_DELETE,
            self::USERS_RESTORE,
            self::USERS_FORCE_DELETE,
            self::USERS_TOGGLE_ACTIVE,
            self::USERS_INVITE,
            self::USERS_CHANGE_ROLE,
            self::USERS_VIEW_ACTIVITY => PermissionModule::USERS,

            self::MESSAGES_SEND_DIRECT,
            self::MESSAGES_SEND_GROUP,
            self::MESSAGES_DELETE_OWN,
            self::MESSAGES_DELETE_ANY,
            self::MESSAGES_SEND_ENCRYPTED_FILE,
            self::MESSAGES_CREATE_CHANNEL,
            self::MESSAGES_MANAGE_CHANNELS,
            self::MESSAGES_VIEW_HISTORY => PermissionModule::MESSAGES,

            self::NOTIFICATIONS_VIEW,
            self::NOTIFICATIONS_MARK_READ,
            self::NOTIFICATIONS_DELETE,
            self::NOTIFICATIONS_MANAGE_ALL,
            self::NOTIFICATIONS_SEND_MANUAL => PermissionModule::NOTIFICATIONS,

            self::AI_USE_CHAT_ASSISTANT,
            self::AI_ANALYZE_PUBLICATION,
            self::AI_SUMMARIZE_MEETING,
            self::AI_VIEW_ANALYSES,
            self::AI_DELETE_ANALYSIS,
            self::AI_CONFIGURE => PermissionModule::AI,

            self::ROLES_VIEW,
            self::ROLES_CREATE,
            self::ROLES_EDIT,
            self::ROLES_DELETE,
            self::ROLES_ASSIGN_PERMISSIONS,
            self::ROLES_ASSIGN_TO_USER => PermissionModule::ROLES,
        };
    }

    public static function allKeys(): array
    {
        return array_map(fn(self $permission) => $permission->value, self::cases());
    }
}
