<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMeetingRequest;
use App\Http\Requests\UpdateMeetingRequest;
use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use App\Models\Project;
use App\Services\MeetingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur des réunions - CollabSearch
 * 
 * Gère les réunions de projet : CRUD, invitation,
 * réponse aux invitations et calendrier.
 */
class MeetingController extends Controller
{
    public function __construct(
        private readonly MeetingService $meetingService
    ) {}

    /**
     * Liste des réunions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $meetings = $this->meetingService->getUserMeetings(
                $request->user(),
                $request->get('project_id'),
                $request->get('status'),
                $request->get('per_page', 15)
            );

            return response()->json([
                'meetings' => MeetingResource::collection($meetings),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des réunions.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer une nouvelle réunion
     */
    public function store(StoreMeetingRequest $request): JsonResponse
    {
        try {
            $meeting = $this->meetingService->create(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'message' => 'Réunion créée avec succès.',
                'meeting' => new MeetingResource($meeting),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la réunion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher les détails d'une réunion
     */
    public function show(Meeting $meeting): JsonResponse
    {
        return response()->json([
            'meeting' => new MeetingResource($meeting->load(['project', 'organizer', 'participants'])),
        ]);
    }

    /**
     * Mettre à jour une réunion
     */
    public function update(UpdateMeetingRequest $request, Meeting $meeting): JsonResponse
    {
        try {
            $meeting = $this->meetingService->update($meeting, $request->validated());

            return response()->json([
                'message' => 'Réunion mise à jour avec succès.',
                'meeting' => new MeetingResource($meeting),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la réunion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer une réunion
     */
    public function destroy(Meeting $meeting): JsonResponse
    {
        try {
            $this->meetingService->delete($meeting);

            return response()->json([
                'message' => 'Réunion supprimée avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la réunion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Inviter des participants à une réunion
     */
    public function invite(Request $request, Meeting $meeting): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        try {
            $this->meetingService->inviteParticipants($meeting, $request->get('user_ids'));

            return response()->json([
                'message' => 'Invitations envoyées avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'envoi des invitations.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Accepter une invitation à une réunion
     */
    public function accept(Meeting $meeting): JsonResponse
    {
        try {
            $this->meetingService->respondToInvitation($meeting, auth()->user(), 'accepted');

            return response()->json([
                'message' => 'Invitation acceptée.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'acceptation de l\'invitation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Décliner une invitation à une réunion
     */
    public function decline(Meeting $meeting): JsonResponse
    {
        try {
            $this->meetingService->respondToInvitation($meeting, auth()->user(), 'declined');

            return response()->json([
                'message' => 'Invitation déclinée.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du déclin de l\'invitation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer le calendrier des réunions
     */
    public function calendar(Request $request): JsonResponse
    {
        try {
            $calendar = $this->meetingService->getCalendar(
                $request->user(),
                $request->get('month'),
                $request->get('year')
            );

            return response()->json([
                'calendar' => $calendar,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération du calendrier.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
