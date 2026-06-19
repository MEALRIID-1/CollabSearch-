<?php

namespace App\Notifications;

use App\Models\Meeting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification d'invitation à une réunion - CollabSearch
 */
class MeetingInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Meeting $meeting,
        public readonly User $invitedBy,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("CollabSearch - Invitation à une réunion")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Vous avez été invité(e) à la réunion **{$this->meeting->title}** par **{$this->invitedBy->full_name}**.")
            ->line("Date : {$this->meeting->scheduled_at?->format('d/m/Y à H:i')}")
            ->when($this->meeting->location, fn ($mail) => $mail->line("Lieu : {$this->meeting->location}"))
            ->when($this->meeting->meeting_url, fn ($mail) => $mail->line("Lien : {$this->meeting->meeting_url}"))
            ->action('Voir la réunion', url("/meetings/{$this->meeting->id}"))
            ->salutation('L\'équipe CollabSearch');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'meeting_id' => $this->meeting->id,
            'meeting_title' => $this->meeting->title,
            'scheduled_at' => $this->meeting->scheduled_at?->toISOString(),
            'location' => $this->meeting->location,
            'meeting_url' => $this->meeting->meeting_url,
            'invited_by' => $this->invitedBy->full_name,
            'type' => 'meeting_invitation',
        ];
    }
}
