<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification de nouveau message - CollabSearch
 */
class NewMessage extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Message $message,
        public readonly User $sender,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("CollabSearch - Nouveau message de {$this->sender->full_name}")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Vous avez reçu un nouveau message de **{$this->sender->full_name}**.")
            ->when($this->message->subject, fn ($mail) => $mail->line("Sujet : {$this->message->subject}"))
            ->line("Message : " . \Str::limit($this->message->content, 150))
            ->action('Voir le message', url("/messages"))
            ->salutation('L\'équipe CollabSearch');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'message_id' => $this->message->id,
            'sender_id' => $this->sender->id,
            'sender_name' => $this->sender->full_name,
            'subject' => $this->message->subject,
            'content_preview' => \Str::limit($this->message->content, 100),
            'type' => 'new_message',
        ];
    }
}
