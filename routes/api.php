<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BudgetController;
use App\Http\Controllers\Api\V1\BudgetLineController;
use App\Http\Controllers\Api\V1\MeetingController;
use App\Http\Controllers\Api\V1\VideoConferenceController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\PublicationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\TaskCommentController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ChatChannelController;
use App\Http\Controllers\Api\V1\ChatMessageController;
use App\Http\Controllers\Api\V1\ChatReactionController;
use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\CustomRoleController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\DashboardController;
use Illuminate\Support\Facades\Route;

// ── Authentification (public) ──────────────────────────────────────────────────
Route::prefix('v1/auth')->group(function () {
    Route::get('/login', fn () => response()->json(['message' => 'Unauthenticated.'], 401))->name('login');
    Route::post('/login',    [AuthController::class, 'login'])->name('auth.login');
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/logout-token', [AuthController::class, 'logout'])->name('auth.logout.token');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('/refresh',         [AuthController::class, 'refresh'])->name('auth.refresh');
        Route::get('/me',               [AuthController::class, 'me'])->name('auth.me');
        Route::put('/profile',          [AuthController::class, 'updateProfile'])->name('auth.update-profile');
        Route::put('/change-password',  [AuthController::class, 'changePassword'])->name('auth.change-password');
    });
});

// ── Routes protégées ───────────────────────────────────────────────────────────
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // ── Conversations ──────────────────────────────────────────────────────────
    Route::prefix('conversations')->group(function () {
        Route::get('/',                             [ConversationController::class, 'index'])->name('conversations.index');
        Route::post('/',                            [ConversationController::class, 'store'])->name('conversations.store');
        Route::post('{conversation}/participants',  [ConversationController::class, 'addParticipants'])->name('conversations.participants.add');
        Route::delete('{conversation}/participants',[ConversationController::class, 'removeParticipant'])->name('conversations.participants.remove');
        Route::get('{conversation}/messages',       [ConversationController::class, 'messages'])->name('conversations.messages');
        Route::post('{conversation}/messages',      [ConversationController::class, 'sendMessage'])->name('conversations.messages.send');
    });

    // ── Projets ────────────────────────────────────────────────────────────────
    Route::middleware('custom_permission:projects.view_list')->group(function () {
        Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
    });
    Route::middleware('custom_permission:projects.view_detail')->group(function () {
        Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    });
    Route::middleware('custom_permission:projects.create')->group(function () {
        Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
    });
    Route::middleware('custom_permission:projects.edit')->group(function () {
        Route::put('projects/{project}',   [ProjectController::class, 'update'])->name('projects.update');
        Route::patch('projects/{project}', [ProjectController::class, 'update']);
    });
    Route::middleware('custom_permission:projects.delete')->group(function () {
        Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    });

    Route::prefix('projects')->group(function () {
        Route::middleware('custom_permission:projects.submit')->group(function () {
            Route::post('{project}/submit',  [ProjectController::class, 'submit'])->name('projects.submit');
        });
        Route::middleware('custom_permission:projects.approve')->group(function () {
            Route::post('{project}/approve', [ProjectController::class, 'approve'])->name('projects.approve');
        });
        Route::middleware('custom_permission:projects.reject')->group(function () {
            Route::post('{project}/reject',  [ProjectController::class, 'reject'])->name('projects.reject');
        });
        Route::middleware('custom_permission:projects.archive')->group(function () {
            Route::post('{project}/archive', [ProjectController::class, 'archive'])->name('projects.archive');
        });
        Route::middleware('custom_permission:projects.manage_members')->group(function () {
            Route::post('{project}/members',   [ProjectController::class, 'addMember'])->name('projects.members.add');
            Route::delete('{project}/members', [ProjectController::class, 'removeMember'])->name('projects.members.remove');
        });
        Route::middleware('custom_permission:projects.manage_milestones')->group(function () {
            Route::get('{project}/milestones',  [ProjectController::class, 'milestones'])->name('projects.milestones');
            Route::post('{project}/milestones', [ProjectController::class, 'storeMilestone'])->name('projects.milestones.store');
        });

        // Tâches du projet
        Route::middleware('custom_permission:tasks.view')->group(function () {
            Route::get('{project}/tasks',        [TaskController::class, 'index'])->name('projects.tasks');
            Route::get('{project}/tasks/kanban', [TaskController::class, 'kanban'])->name('projects.tasks.kanban');
            Route::get('{project}/tasks/trash',  [TaskController::class, 'trash'])->name('projects.tasks.trash');
        });
        Route::middleware('custom_permission:tasks.create')->group(function () {
            Route::post('{project}/tasks', [TaskController::class, 'store'])->name('projects.tasks.store');
        });

        // Budget
        Route::middleware('custom_permission:projects.view_budget')->group(function () {
            Route::get('{project}/budget',        [BudgetController::class, 'projectBudget'])->name('projects.budget');
            Route::get('{project}/budget/export', [BudgetController::class, 'export'])->name('projects.budget.export');
            Route::get('{project}/budget-lines',         [BudgetLineController::class, 'index'])->name('projects.budget-lines');
            Route::get('{project}/budget-lines/summary', [BudgetLineController::class, 'summary'])->name('projects.budget-lines.summary');
            Route::get('{project}/budget-lines/alert',   [BudgetLineController::class, 'checkAlert'])->name('projects.budget-lines.alert');
        });
        Route::middleware('custom_permission:projects.manage_budget')->group(function () {
            Route::post('{project}/budget-lines', [BudgetLineController::class, 'store'])->name('projects.budget-lines.store');
        });
    });

    // ── Tâches ─────────────────────────────────────────────────────────────────
    Route::prefix('tasks')->group(function () {
        Route::middleware('custom_permission:tasks.view')->group(function () {
            Route::get('{task}', [TaskController::class, 'show'])->name('tasks.show');
        });
        // edit_own OU edit_any suffisent
        Route::middleware('custom_permission:tasks.edit_own,tasks.edit_any')->group(function () {
            Route::put('{task}', [TaskController::class, 'update'])->name('tasks.update');
        });
        Route::middleware('custom_permission:tasks.change_status')->group(function () {
            Route::patch('{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.update-status');
        });
        Route::middleware('custom_permission:tasks.assign')->group(function () {
            Route::post('{task}/assign', [TaskController::class, 'assign'])->name('tasks.assign');
        });
        Route::middleware('custom_permission:tasks.validate')->group(function () {
            Route::post('{task}/validate', [TaskController::class, 'validateTask'])->name('tasks.validate');
            Route::post('{task}/refuse',   [TaskController::class, 'refuseTask'])->name('tasks.refuse');
        });
        Route::middleware('custom_permission:tasks.delete_own,tasks.delete_any')->group(function () {
            Route::delete('{task}',       [TaskController::class, 'destroy'])->name('tasks.destroy');
            Route::post('{task}/restore', [TaskController::class, 'restore'])->name('tasks.restore');
            Route::delete('{task}/force', [TaskController::class, 'forceDelete'])->name('tasks.force-delete');
        });
        Route::middleware('custom_permission:tasks.comment')->group(function () {
            Route::get('{task}/comments',                        [TaskCommentController::class, 'index'])->name('tasks.comments');
            Route::post('{task}/comments',                       [TaskCommentController::class, 'store'])->name('tasks.comments.store');
            Route::delete('{task}/comments/{commentId}',         [TaskCommentController::class, 'destroy'])->name('tasks.comments.destroy');
        });
        Route::middleware('custom_permission:tasks.attach_files')->group(function () {
            Route::post('{task}/attachments',                              [TaskController::class, 'uploadAttachment'])->name('tasks.attachments.upload');
            Route::get('{task}/attachments/{attachment}/download',         [TaskController::class, 'downloadAttachment'])->name('tasks.attachments.download');
        });
    });

    // ── Publications ───────────────────────────────────────────────────────────
    Route::prefix('publications')->group(function () {
        Route::middleware('custom_permission:publications.view_list')->group(function () {
            Route::get('search', [PublicationController::class, 'search'])->name('publications.search');
        });
        Route::middleware('custom_permission:publications.export_bibtex')->group(function () {
            Route::get('export/bibtex', [PublicationController::class, 'exportBibtex'])->name('publications.export.bibtex');
        });
        Route::middleware('custom_permission:publications.export_apa')->group(function () {
            Route::get('export/apa', [PublicationController::class, 'exportApa'])->name('publications.export.apa');
        });
        Route::middleware('custom_permission:publications.edit_own,publications.edit_any')->group(function () {
            Route::post('{publication}/pdf', [PublicationController::class, 'uploadPdf'])->name('publications.pdf');
        });
        Route::middleware('custom_permission:publications.ai_analyze')->group(function () {
            Route::post('{publication}/analyze', [AiController::class, 'analyzePublication'])->name('publications.analyze');
        });
    });
    Route::middleware('custom_permission:publications.view_list')->group(function () {
        Route::get('publications',              [PublicationController::class, 'index'])->name('publications.index');
        Route::get('publications/{publication}',[PublicationController::class, 'show'])->name('publications.show');
    });
    Route::middleware('custom_permission:publications.submit')->group(function () {
        Route::post('publications', [PublicationController::class, 'store'])->name('publications.store');
    });
    Route::middleware('custom_permission:publications.edit_own,publications.edit_any')->group(function () {
        Route::put('publications/{publication}',   [PublicationController::class, 'update'])->name('publications.update');
        Route::patch('publications/{publication}', [PublicationController::class, 'update']);
    });
    Route::middleware('custom_permission:publications.delete_own,publications.delete_any')->group(function () {
        Route::delete('publications/{publication}', [PublicationController::class, 'destroy'])->name('publications.destroy');
    });

    // ── Lignes budgétaires directes ────────────────────────────────────────────
    Route::prefix('budget-lines')->group(function () {
        Route::middleware('custom_permission:projects.view_budget')->group(function () {
            Route::get('{budgetLine}', [BudgetLineController::class, 'show'])->name('budget-lines.show');
        });
        Route::middleware('custom_permission:projects.manage_budget')->group(function () {
            Route::put('{budgetLine}',    [BudgetLineController::class, 'update'])->name('budget-lines.update');
            Route::delete('{budgetLine}', [BudgetLineController::class, 'destroy'])->name('budget-lines.destroy');
        });
    });

    // ── Réunions / Calendrier ──────────────────────────────────────────────────
    Route::prefix('meetings')->group(function () {
        Route::middleware('custom_permission:calendar.view')->group(function () {
            Route::get('calendar', [MeetingController::class, 'calendar'])->name('meetings.calendar');
        });
        Route::middleware('custom_permission:calendar.invite_participants')->group(function () {
            Route::post('{meeting}/invite',  [MeetingController::class, 'invite'])->name('meetings.invite');
        });
        Route::middleware('custom_permission:calendar.join_video_call')->group(function () {
            Route::post('{meeting}/accept',  [MeetingController::class, 'accept'])->name('meetings.accept');
            Route::post('{meeting}/decline', [MeetingController::class, 'decline'])->name('meetings.decline');
            Route::get('{meeting}/join',     [VideoConferenceController::class, 'joinRoom'])->name('meetings.join');
        });
        Route::middleware('custom_permission:calendar.start_video_call')->group(function () {
            Route::post('{meeting}/end',       [VideoConferenceController::class, 'endRoom'])->name('meetings.end');
            Route::post('{meeting}/recording', [VideoConferenceController::class, 'saveRecording'])->name('meetings.recording');
        });
        Route::middleware('custom_permission:calendar.ai_summarize')->group(function () {
            Route::post('{meeting}/analyze', [AiController::class, 'analyzeMeeting'])->name('meetings.analyze');
        });
    });
    Route::middleware('custom_permission:calendar.view')->group(function () {
        Route::get('meetings',            [MeetingController::class, 'index'])->name('meetings.index');
        Route::get('meetings/{meeting}',  [MeetingController::class, 'show'])->name('meetings.show');
    });
    Route::middleware('custom_permission:calendar.create_meeting')->group(function () {
        Route::post('meetings', [MeetingController::class, 'store'])->name('meetings.store');
    });
    Route::middleware('custom_permission:calendar.edit_own_meeting,calendar.edit_any_meeting')->group(function () {
        Route::put('meetings/{meeting}',   [MeetingController::class, 'update'])->name('meetings.update');
        Route::patch('meetings/{meeting}', [MeetingController::class, 'update']);
    });
    Route::middleware('custom_permission:calendar.delete_meeting')->group(function () {
        Route::delete('meetings/{meeting}', [MeetingController::class, 'destroy'])->name('meetings.destroy');
    });

    // ── Messages directs ───────────────────────────────────────────────────────
    Route::prefix('messages')->group(function () {
        Route::middleware('custom_permission:messages.send_direct')->group(function () {
            Route::post('/',                       [MessageController::class, 'send'])->name('messages.send');
            Route::get('conversations',            [MessageController::class, 'conversations'])->name('messages.conversations');
            Route::get('conversation/{userId}',    [MessageController::class, 'conversation'])->name('messages.conversation');
        });
        Route::middleware('custom_permission:messages.delete_own,messages.delete_any')->group(function () {
            Route::delete('{message}', [MessageController::class, 'destroy'])->name('messages.destroy');
        });
    });

    // ── Chat Channels ──────────────────────────────────────────────────────────
    Route::prefix('chat-channels')->group(function () {
        Route::middleware('custom_permission:messages.send_group')->group(function () {
            Route::get('/',                    [ChatChannelController::class, 'index'])->name('chat-channels.index');
            Route::get('{chatChannel}',        [ChatChannelController::class, 'show'])->name('chat-channels.show');
            Route::get('{chatChannel}/members',[ChatChannelController::class, 'members'])->name('chat-channels.members.index');
            Route::get('{chatChannel}/messages',[ChatMessageController::class, 'index'])->name('chat-channels.messages.index');
            Route::post('{chatChannel}/messages',[ChatMessageController::class, 'store'])->name('chat-channels.messages.store');
        });
        Route::middleware('custom_permission:messages.create_channel')->group(function () {
            Route::post('/', [ChatChannelController::class, 'store'])->name('chat-channels.store');
        });
        Route::middleware('custom_permission:messages.manage_channels')->group(function () {
            Route::put('{chatChannel}',           [ChatChannelController::class, 'update'])->name('chat-channels.update');
            Route::post('{chatChannel}/archive',  [ChatChannelController::class, 'archive'])->name('chat-channels.archive');
            Route::post('{chatChannel}/members',  [ChatChannelController::class, 'addMember'])->name('chat-channels.members.add');
            Route::delete('{chatChannel}/members',[ChatChannelController::class, 'removeMember'])->name('chat-channels.members.remove');
        });
        Route::middleware('custom_permission:messages.delete_own,messages.delete_any')->group(function () {
            Route::put('{chatChannel}/messages/{chatMessage}',    [ChatMessageController::class, 'update'])->name('chat-channels.messages.update');
            Route::delete('{chatChannel}/messages/{chatMessage}', [ChatMessageController::class, 'destroy'])->name('chat-channels.messages.destroy');
        });
        Route::middleware('custom_permission:messages.send_group')->group(function () {
            Route::post('{chatChannel}/messages/{chatMessage}/reactions',   [ChatReactionController::class, 'store'])->name('chat-channels.messages.reactions.store');
            Route::delete('{chatChannel}/messages/{chatMessage}/reactions', [ChatReactionController::class, 'destroy'])->name('chat-channels.messages.reactions.destroy');
        });
    });

    // ── Médias ─────────────────────────────────────────────────────────────────
    Route::prefix('media')->group(function () {
        Route::post('upload',            [MediaController::class, 'upload'])->name('media.upload');
        Route::get('{attachmentId}/download', [MediaController::class, 'download'])->name('media.download');
        Route::delete('{attachmentId}',  [MediaController::class, 'delete'])->name('media.delete');
    });

    // ── Notifications ──────────────────────────────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::middleware('custom_permission:notifications.view')->group(function () {
            Route::get('/',             [NotificationController::class, 'index'])->name('notifications.index');
            Route::get('unread-count',  [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        });
        Route::middleware('custom_permission:notifications.mark_read')->group(function () {
            Route::post('{notificationId}/read', [NotificationController::class, 'markRead'])->name('notifications.mark-read');
            Route::post('read-all',              [NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
        });
    });

    // ── Utilisateurs ───────────────────────────────────────────────────────────
    Route::middleware('custom_permission:users.view_list')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
    });
    Route::middleware('custom_permission:users.view_profile')->group(function () {
        Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    });
    Route::middleware('custom_permission:users.edit')->group(function () {
        Route::put('users/{user}',   [UserController::class, 'update'])->name('users.update');
        Route::patch('users/{user}', [UserController::class, 'update']);
    });
    Route::middleware('custom_permission:users.delete')->group(function () {
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
    Route::middleware('custom_permission:users.create')->group(function () {
        Route::post('users', [UserController::class, 'store'])->name('users.store');
    });

    // ── Administration (admin uniquement) ──────────────────────────────────────
    Route::prefix('admin')->middleware('role:administrator')->group(function () {
        Route::get('dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
        Route::get('users',     [AdminController::class, 'users'])->name('admin.users');
        Route::get('stats',     [AdminController::class, 'stats'])->name('admin.stats');

        Route::prefix('my-users')->group(function () {
            Route::get('/',                    [AdminUserController::class, 'index'])->name('admin.my-users.index');
            Route::post('/',                   [AdminUserController::class, 'store'])->name('admin.my-users.store');
            Route::post('/invite',             [AdminUserController::class, 'invite'])->name('admin.my-users.invite');
            Route::get('trashed',              [AdminUserController::class, 'trashed'])->name('admin.my-users.trashed');
            Route::post('{user}/restore',      [AdminUserController::class, 'restore'])->name('admin.my-users.restore');
            Route::get('{user}',               [AdminUserController::class, 'show'])->name('admin.my-users.show');
            Route::put('{user}',               [AdminUserController::class, 'update'])->name('admin.my-users.update');
            Route::delete('{user}',            [AdminUserController::class, 'destroy'])->name('admin.my-users.destroy');
        });
    });

    // ── Rapports ───────────────────────────────────────────────────────────────
    Route::prefix('reports')->group(function () {
        Route::get('project/{projectId}', [ReportController::class, 'projectReport'])->name('reports.project');
        Route::get('team',                [ReportController::class, 'teamReport'])->name('reports.team');
        Route::get('budget/{projectId}',  [ReportController::class, 'budgetReport'])->name('reports.budget');
    });

    // ── Assistant IA ───────────────────────────────────────────────────────────
    // Les routes chat/conversations/mémoire sont accessibles à tout utilisateur
    // authentifié (auth:sanctum suffit). Seule l'admin-config reste protégée.
    Route::prefix('ai')->group(function () {
        // Analyses — lecture accessible à tous les authentifiés
        Route::get('analyses/{uuid}', [AiController::class, 'getAnalysis'])->name('ai.analysis.show');

        // Chat stateless (legacy)
        Route::post('chat', [AiController::class, 'chatAssistant'])->name('ai.chat');

        // Conversations — CRUD accessible à tous les utilisateurs authentifiés
        Route::get('conversations',                        [AiController::class, 'conversations'])->name('ai.conversations');
        Route::post('conversations',                       [AiController::class, 'createConversation'])->name('ai.conversations.create');
        Route::get('conversations/{id}/messages',          [AiController::class, 'getMessages'])->name('ai.conversations.messages');
        Route::post('conversations/{id}/chat',             [AiController::class, 'chat'])->name('ai.conversations.chat');
        Route::put('conversations/{id}/archive',           [AiController::class, 'archiveConversation'])->name('ai.conversations.archive');
        Route::delete('conversations/{id}',                [AiController::class, 'deleteConversation'])->name('ai.conversations.delete');
        Route::post('conversations/{id}/restore',          [AiController::class, 'restoreConversation'])->name('ai.conversations.restore');
        Route::post('conversations/{id}/export',           [AiController::class, 'exportConversation'])->name('ai.conversations.export');
        Route::get('conversations/{id}/summary',           [AiController::class, 'conversationSummary'])->name('ai.conversations.summary');

        // Mémoire — accessible à tous les authentifiés
        Route::get('memory',         [AiController::class, 'getMemory'])->name('ai.memory');
        Route::post('memory',        [AiController::class, 'saveMemory'])->name('ai.memory.save');
        Route::delete('memory/{id}', [AiController::class, 'deleteMemory'])->name('ai.memory.delete');
    });

    // ── Dashboard par rôle ────────────────────────────────────────────────────
    Route::prefix('dashboard')->group(function () {
        Route::get('admin',       [DashboardController::class, 'adminStats']);
        Route::get('team-lead',   [DashboardController::class, 'teamLeadStats']);
        Route::get('researcher',  [DashboardController::class, 'researcherStats']);
        Route::get('institution', [DashboardController::class, 'institutionStats']);
    });

    // ── Stats graphiques ──────────────────────────────────────────────────────
    Route::prefix('stats')->group(function () {
        Route::get('productivity',     [DashboardController::class, 'productivity']);
        Route::get('tasks-by-status',  [DashboardController::class, 'tasksByStatus']);
        Route::get('activity-heatmap', [DashboardController::class, 'activityHeatmap']);
        Route::get('publications',     [DashboardController::class, 'publicationsTrend']);
        Route::get('budget',           [DashboardController::class, 'budgetByProject']);
        Route::get('health-score',     [DashboardController::class, 'healthScore']);
        Route::get('activity-feed',    [DashboardController::class, 'activityFeed']);
    });

    // ── Rôles & Permissions (admin uniquement) ─────────────────────────────────
    Route::prefix('roles')->middleware('role:administrator')->group(function () {
        Route::get('permissions/catalog',             [CustomRoleController::class, 'permissionsCatalog'])->name('roles.permissions.catalog');
        Route::delete('users/{userUuid}/unassign',    [CustomRoleController::class, 'removeFromUser'])->name('roles.users.unassign');
        Route::get('/',                               [CustomRoleController::class, 'index'])->name('roles.index');
        Route::post('/',                              [CustomRoleController::class, 'store'])->name('roles.store');
        Route::get('{uuid}',                          [CustomRoleController::class, 'show'])->name('roles.show');
        Route::put('{uuid}',                          [CustomRoleController::class, 'update'])->name('roles.update');
        Route::put('{uuid}/permissions',              [CustomRoleController::class, 'syncPermissions'])->name('roles.permissions.sync');
        Route::delete('{uuid}',                       [CustomRoleController::class, 'destroy'])->name('roles.destroy');
        Route::post('{uuid}/assign',                  [CustomRoleController::class, 'assignToUser'])->name('roles.assign');
    });
});
