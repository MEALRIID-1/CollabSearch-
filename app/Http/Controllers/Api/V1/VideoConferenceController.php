<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use App\Models\User;
use App\Services\JitsiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur visioconférence Jitsi - CollabSearch
 *
 * Gère la connexion, la fin de réunion et les webhooks d'enregistrement.
 */
class VideoConferenceController extends Controller
{
    public function __construct(
        private readonly JitsiService $jitsiService
    ) {}

    /**
     * Rejoindre une salle de visioconférence
     */
    public function joinRoom(Request $request, Meeting $meeting): JsonResponse
    {
        $user = $request->user();

        if (!$this->canAccessMeeting($meeting, $user)) {
            return response()->json([
                'message' => 'Vous n\'êtes pas autorisé à rejoindre cette réunion.',
            ], 403);
        }

        try {
            if (empty($meeting->jitsi_room_id)) {
                $roomId = $this->jitsiService->generateRoomId($meeting);
                $meeting->update([
                    'jitsi_room_id' => $roomId,
                    'meeting_url' => $this->jitsiService->getRoomUrl($roomId),
                ]);
            }

            if (!$meeting->started_at && $meeting->status?->value !== 'cancelled') {
                $meeting->update([
                    'started_at' => now(),
                    'status' => 'in_progress',
                ]);
            }

            $jwt = $this->jitsiService->generateJWT($user, $meeting->jitsi_room_id);

            if ($jwt) {
                $meeting->update(['jitsi_jwt_token' => $jwt]);
            }

            return response()->json([
                'room_id' => $meeting->jitsi_room_id,
                'room_url' => $this->jitsiService->getRoomUrl($meeting->jitsi_room_id),
                'jwt' => $jwt,
                'server_url' => config('jitsi.server_url'),
                'domain' => $this->jitsiService->getDomain(),
                'app_id' => config('jitsi.app_id'),
                'user' => [
                    'id' => $user->id,
                    'name' => $user->full_name,
                    'email' => $user->email,
                ],
                'meeting' => [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'started_at' => $meeting->started_at?->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la connexion à la visioconférence.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Terminer une réunion de visioconférence
     */
    public function endRoom(Request $request, Meeting $meeting): JsonResponse
    {
        $user = $request->user();

        if ($meeting->organizer_id !== $user->id) {
            return response()->json([
                'message' => 'Seul l\'organisateur peut terminer la réunion.',
            ], 403);
        }

        try {
            $actualDuration = $meeting->started_at
                ? (int) $meeting->started_at->diffInMinutes(now())
                : null;

            $meeting->update([
                'status' => 'completed',
                'actual_duration_minutes' => $actualDuration,
            ]);

            return response()->json([
                'message' => 'Réunion terminée avec succès.',
                'meeting' => new MeetingResource($meeting->fresh(['project', 'organizer', 'participants'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la fin de la réunion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Webhook Jitsi — sauvegarder l'enregistrement et la transcription
     */
    public function saveRecording(Request $request, Meeting $meeting): JsonResponse
    {
        $webhookSecret = config('jitsi.webhook_secret');

        if ($webhookSecret && $request->header('X-Jitsi-Webhook-Secret') !== $webhookSecret) {
            return response()->json([
                'message' => 'Webhook non autorisé.',
            ], 401);
        }

        $validated = $request->validate([
            'recording_url' => 'nullable|url|max:500',
            'recording_transcript' => 'nullable|string',
            'meeting_summary' => 'nullable|string',
        ]);

        try {
            $meeting->update(array_filter([
                'recording_url' => $validated['recording_url'] ?? null,
                'recording_transcript' => $validated['recording_transcript'] ?? null,
                'meeting_summary' => $validated['meeting_summary'] ?? null,
            ], fn ($value) => $value !== null));

            return response()->json([
                'message' => 'Enregistrement sauvegardé avec succès.',
                'meeting' => new MeetingResource($meeting->fresh()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la sauvegarde de l\'enregistrement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Vérifier si l'utilisateur peut accéder à la réunion
     */
    private function canAccessMeeting(Meeting $meeting, User $user): bool
    {
        if ($meeting->organizer_id === $user->id) {
            return true;
        }

        return $meeting->participants()->where('user_id', $user->id)->exists();
    }
}
