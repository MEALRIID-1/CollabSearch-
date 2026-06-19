<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur des notifications - CollabSearch
 * 
 * Gère les notifications utilisateur : liste,
 * marquage comme lu et compteur de non lues.
 */
class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Liste des notifications de l'utilisateur
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $notifications = $this->notificationService->getUserNotifications(
                $request->user(),
                $request->get('per_page', 20)
            );

            return response()->json([
                'notifications' => NotificationResource::collection($notifications),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des notifications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marquer une notification comme lue
     */
    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        try {
            $marked = $this->notificationService->markAsRead(
                $request->user(),
                $notificationId
            );

            if (!$marked) {
                return response()->json([
                    'message' => 'Notification introuvable.',
                ], 404);
            }

            return response()->json([
                'message' => 'Notification marquée comme lue.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du marquage de la notification.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllRead(Request $request): JsonResponse
    {
        try {
            $this->notificationService->markAllAsRead($request->user());

            return response()->json([
                'message' => 'Toutes les notifications ont été marquées comme lues.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du marquage des notifications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Nombre de notifications non lues
     */
    public function unreadCount(Request $request): JsonResponse
    {
        try {
            $count = $this->notificationService->getUnreadCount($request->user());

            return response()->json([
                'unread_count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du comptage des notifications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
