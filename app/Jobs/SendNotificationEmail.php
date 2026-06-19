<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

/**
 * Tâche d'envoi d'e-mail de notification - CollabSearch
 * 
 * Envoie un e-mail de notification de manière asynchrone
 * via la file d'attente Redis.
 */
class SendNotificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Nombre de tentatives en cas d'échec */
    public int $tries = 3;

    /** Délai entre les tentatives (secondes) */
    public int $backoff = 60;

    /**
     * Créer une nouvelle instance de la tâche
     */
    public function __construct(
        public readonly User $user,
        public readonly string $subject,
        public readonly string $content,
        public readonly ?string $actionUrl = null,
        public readonly ?string $actionText = null,
    ) {}

    /**
     * Exécuter la tâche
     */
    public function handle(): void
    {
        Mail::send('emails.notification', [
            'user' => $this->user,
            'subject' => $this->subject,
            'content' => $this->content,
            'actionUrl' => $this->actionUrl,
            'actionText' => $this->actionText,
        ], function ($message) {
            $message->to($this->user->email, $this->user->full_name)
                    ->subject($this->subject);
        });
    }

    /**
     * Gérer l'échec de la tâche
     */
    public function failed(\Throwable $exception): void
    {
        \Log::error("Échec de l'envoi de l'e-mail de notification", [
            'user_id' => $this->user->id,
            'subject' => $this->subject,
            'error' => $exception->getMessage(),
        ]);
    }
}
