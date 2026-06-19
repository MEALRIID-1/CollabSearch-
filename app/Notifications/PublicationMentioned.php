<?php

namespace App\Notifications;

use App\Models\Publication;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification de mention dans une publication - CollabSearch
 */
class PublicationMentioned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Publication $publication,
        public readonly User $mentionedBy,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("CollabSearch - Vous avez été mentionné(e) dans une publication")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Vous avez été mentionné(e) dans la publication **{$this->publication->title}** par **{$this->mentionedBy->full_name}**.")
            ->line("Type : {$this->publication->type?->label()}")
            ->when($this->publication->journal, fn ($mail) => $mail->line("Journal : {$this->publication->journal}"))
            ->action('Voir la publication', url("/publications/{$this->publication->id}"))
            ->salutation('L\'équipe CollabSearch');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'publication_id' => $this->publication->id,
            'publication_title' => $this->publication->title,
            'publication_type' => $this->publication->type?->value,
            'mentioned_by' => $this->mentionedBy->full_name,
            'type' => 'publication_mentioned',
        ];
    }
}
