<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Meeting;
use App\Models\User;
use App\Notifications\MeetingInvitation;
use Illuminate\Support\Facades\DB;

/**
 * Service de gestion des réunions - CollabSearch
 * 
 * Gère les opérations métier liées aux réunions :
 * CRUD, invitations, réponses et calendrier.
 */
class MeetingService
{
    /**
     * Récupérer les réunions de l'utilisateur
     */
    public function getUserMeetings(User $user, ?int $projectId = null, ?string $status = null, int $perPage = 15)
    {
        $query = Meeting::with(['project', 'organizer', 'participants'])
            ->where('organizer_id', $user->id)
            ->orWhereHas('participants', fn ($q) => $q->where('user_id', $user->id));

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderBy('scheduled_at', 'asc')->paginate($perPage);
    }

    /**
     * Créer une nouvelle réunion
     */
    public function create(User $user, array $data): Meeting
    {
        return DB::transaction(function () use ($user, $data) {
            $meeting = Meeting::create([
                ...$data,
                'organizer_id' => $user->id,
                'status' => 'scheduled',
            ]);

            // Ajouter l'organisateur comme participant accepté
            $meeting->participants()->attach($user->id, [
                'status' => 'accepted',
                'response_at' => now(),
            ]);

            // Inviter les participants
            if (isset($data['participant_ids'])) {
                $this->inviteParticipants($meeting, $data['participant_ids']);
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'project_id' => $meeting->project_id,
                'action' => ActivityLog::ACTION_CREATE,
                'description' => "Réunion '{$meeting->title}' créée",
                'subject_type' => Meeting::class,
                'subject_id' => $meeting->id,
            ]);

            return $meeting->load(['project', 'organizer', 'participants']);
        });
    }

    /**
     * Mettre à jour une réunion
     */
    public function update(Meeting $meeting, array $data): Meeting
    {
        DB::transaction(function () use ($meeting, $data) {
            $meeting->update($data);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $meeting->project_id,
                'action' => ActivityLog::ACTION_UPDATE,
                'description' => "Réunion '{$meeting->title}' mise à jour",
            ]);
        });

        return $meeting->fresh();
    }

    /**
     * Supprimer une réunion
     */
    public function delete(Meeting $meeting): void
    {
        DB::transaction(function () use ($meeting) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'project_id' => $meeting->project_id,
                'action' => ActivityLog::ACTION_DELETE,
                'description' => "Réunion '{$meeting->title}' supprimée",
            ]);

            $meeting->delete();
        });
    }

    /**
     * Inviter des participants à une réunion
     */
    public function inviteParticipants(Meeting $meeting, array $userIds): void
    {
        DB::transaction(function () use ($meeting, $userIds) {
            foreach ($userIds as $userId) {
                if (!$meeting->participants()->where('user_id', $userId)->exists()) {
                    $meeting->participants()->attach($userId, [
                        'status' => 'pending',
                    ]);

                    // Notifier le participant (silencieux si le serveur mail est indisponible)
                    $user = User::find($userId);
                    try {
                        $user?->notify(new MeetingInvitation($meeting, auth()->user()));
                    } catch (\Throwable $e) {
                        \Log::warning('MeetingService: notification email failed', [
                            'user_id'    => $userId,
                            'meeting_id' => $meeting->id,
                            'error'      => $e->getMessage(),
                        ]);
                    }
                }
            }
        });
    }

    /**
     * Répondre à une invitation
     */
    public function respondToInvitation(Meeting $meeting, User $user, string $status): void
    {
        $meeting->participants()->updateExistingPivot($user->id, [
            'status' => $status,
            'response_at' => now(),
        ]);
    }

    /**
     * Récupérer le calendrier des réunions
     */
    public function getCalendar(User $user, ?int $month = null, ?int $year = null): array
    {
        $month = $month ?? now()->month;
        $year = $year ?? now()->year;

        $startDate = now()->setYear($year)->setMonth($month)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $meetings = Meeting::with(['project', 'organizer', 'participants'])
            ->where(function ($q) use ($user) {
                $q->where('organizer_id', $user->id)
                  ->orWhereHas('participants', fn ($q) => $q->where('user_id', $user->id));
            })
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->orderBy('scheduled_at')
            ->get();

        return [
            'month' => $month,
            'year' => $year,
            'meetings' => $meetings->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'description' => $m->description,
                'agenda' => $m->agenda,
                'scheduled_at' => $m->scheduled_at?->toISOString(),
                'ended_at' => $m->ended_at?->toISOString(),
                'status' => $m->status?->value,
                'project' => $m->project?->title,
                'location' => $m->location,
                'meeting_url' => $m->meeting_url,
                'is_online' => (bool) $m->is_online,
                'organizer_id' => $m->organizer_id,
                'participants' => $m->participants->map(fn ($p) => [
                    'id' => $p->id,
                    'full_name' => $p->full_name,
                    'email' => $p->email,
                    'avatar' => $p->avatar,
                    'pivot_status' => $p->pivot->status,
                ])->values()->toArray(),
            ]),
        ];
    }
}
