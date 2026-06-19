<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification de révision de tâche (validée ou refusée) - CollabSearch
 */
class TaskReviewed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Task $task,
        public readonly User $reviewer,
        public readonly bool $validated, // true = validée, false = refusée
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $action = $this->validated ? 'validée' : 'refusée';
        $emoji  = $this->validated ? '✅' : '❌';

        return (new MailMessage)
            ->subject("CollabSearch - Tâche {$action}")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("{$emoji} La tâche **{$this->task->title}** a été **{$action}** par {$this->reviewer->full_name}.")
            ->line("Projet : {$this->task->project->title}")
            ->when(!$this->validated, fn ($mail) => $mail->line('Vous pouvez reprendre cette tâche et la soumettre à nouveau.'))
            ->action('Voir la tâche', url("/tasks/{$this->task->id}"))
            ->salutation("L'équipe CollabSearch");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'task_id'       => $this->task->id,
            'task_title'    => $this->task->title,
            'project_id'    => $this->task->project_id,
            'project_title' => $this->task->project->title,
            'reviewer'      => $this->reviewer->full_name,
            'validated'     => $this->validated,
            'type'          => $this->validated ? 'task_validated' : 'task_refused',
        ];
    }
}
