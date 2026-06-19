<?php

namespace App\Services;

use App\Models\User;

/**
 * Service de gestion des notifications - CollabSearch
 * 
 * Gère les notifications utilisateur : liste,
 * marquage comme lu et compteur de non lues.
 */
class NotificationService
{
    /**
     * Récupérer les notifications de l'utilisateur
     */
    public function getUserNotifications(User $user, int $perPage = 20)
    {
        return $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(User $user, string $notificationId): bool
    {
        $notification = $user->notifications()->where('id', $notificationId)->first();

        if (!$notification) {
            return false;
        }

        $notification->markAsRead();

        return true;
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(User $user): void
    {
        $user->unreadNotifications->markAsRead();
    }

    /**
     * Compter les notifications non lues
     */
    public function getUnreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }
}
