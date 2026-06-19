'use client';

import { useState } from 'react';
import { Check, Plus, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useProjectMilestones } from '@/lib/hooks/use-projects';
import { projectsApi } from '@/lib/api/projects';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { Milestone } from '@/types/models';

interface MilestoneListProps {
  projectId: number;
}

export function MilestoneList({ projectId }: MilestoneListProps) {
  const { data: milestones, isLoading } = useProjectMilestones(projectId);
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleComplete = async (milestone: Milestone) => {
    try {
      await projectsApi.updateMilestone(projectId, milestone.id, {
        completed: !milestone.completed,
      });
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    } catch {
      // Error handled silently
    }
  };

  const handleAddMilestone = async () => {
    if (!newTitle.trim() || !newDueDate) return;
    setIsSubmitting(true);
    try {
      await projectsApi.createMilestone(projectId, {
        title: newTitle.trim(),
        due_date: newDueDate,
        description: '',
      });
      setNewTitle('');
      setNewDueDate('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
    } catch {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Chargement des jalons...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Jalons</CardTitle>
          {can('projects.manage_milestones') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add milestone form */}
        {showForm && can('projects.manage_milestones') && (
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
            <Input
              placeholder="Titre du jalon"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddMilestone}
                disabled={isSubmitting || !newTitle.trim() || !newDueDate}
              >
                {isSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setNewTitle('');
                  setNewDueDate('');
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Milestone list */}
        {!milestones || milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun jalon défini
          </p>
        ) : (
          <div className="space-y-2">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  milestone.completed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-gray-200'
                )}
              >
                <Checkbox
                  checked={milestone.completed}
                  onCheckedChange={() => handleToggleComplete(milestone)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      milestone.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {milestone.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(milestone.due_date)}
                    </span>
                    {milestone.completed && milestone.completed_at && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800">
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Terminé
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
