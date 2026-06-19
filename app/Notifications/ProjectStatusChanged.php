<?php

namespace App\Notifications;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification de changement de statut de projet - CollabSearch
 */
class ProjectStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly ProjectStatus $oldStatus,
        public readonly ProjectStatus $newStatus,
        public readonly User $changedBy,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("CollabSearch - Statut du projet modifié")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Le statut du projet **{$this->project->title}** a été modifié.")
            ->line("Ancien statut : **{$this->oldStatus->label()}**")
            ->line("Nouveau statut : **{$this->newStatus->label()}**")
            ->line("Modifié par : {$this->changedBy->full_name}")
            ->action('Voir le projet', url("/projects/{$this->project->id}"))
            ->salutation('L\'équipe CollabSearch');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'project_id' => $this->project->id,
            'project_title' => $this->project->title,
            'old_status' => $this->oldStatus->value,
            'old_status_label' => $this->oldStatus->label(),
            'new_status' => $this->newStatus->value,
            'new_status_label' => $this->newStatus->label(),
            'changed_by' => $this->changedBy->full_name,
            'type' => 'project_status_changed',
        ];
    }
}
