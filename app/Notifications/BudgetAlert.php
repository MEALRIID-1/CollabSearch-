<?php

namespace App\Notifications;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification d'alerte budgétaire - CollabSearch
 */
class BudgetAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly array $alerts,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("CollabSearch - Alerte budgétaire")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Des alertes budgétaires ont été détectées pour le projet **{$this->project->title}**.");

        foreach ($this->alerts as $alert) {
            $mail->line("⚠️ {$alert['message']}");
        }

        return $mail
            ->action('Voir le budget', url("/projects/{$this->project->id}/budget"))
            ->salutation('L\'équipe CollabSearch');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'project_id' => $this->project->id,
            'project_title' => $this->project->title,
            'budget_percentage' => $this->project->budget_percentage,
            'alerts' => $this->alerts,
            'type' => 'budget_alert',
        ];
    }
}
