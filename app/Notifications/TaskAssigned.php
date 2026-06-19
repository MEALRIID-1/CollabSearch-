<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification d'assignation de tâche - CollabSearch
 */
class TaskAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Task $task,
        public readonly User $assignedBy,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("CollabSearch - Nouvelle tâche assignée")
            ->greeting("Bonjour {$notifiable->first_name},")
            ->line("Une tâche vous a été assignée par **{$this->assignedBy->full_name}**.")
            ->line("Tâche : **{$this->task->title}**")
            ->line("Projet : {$this->task->project->title}")
            ->line("Priorité : {$this->task->priority_label}")
            ->when($this->task->due_date, fn ($mail) => $mail->line("Date limite : {$this->task->due_date->format('d/m/Y')}"))
            ->action('Voir la tâche', url("/tasks/{$this->task->id}"))
            ->salutation('L\'équipe CollabSearch');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'project_title' => $this->task->project->title,
            'assigned_by' => $this->assignedBy->full_name,
            'priority' => $this->task->priority,
            'due_date' => $this->task->due_date?->toISOString(),
            'type' => 'task_assigned',
        ];
    }
}
