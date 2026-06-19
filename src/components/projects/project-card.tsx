'use client';

import { Users, BarChart3, FolderKanban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PROJECT_STATUSES } from '@/lib/utils/constants';
import { formatDate, getInitials, truncateText } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Project } from '@/types/models';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = PROJECT_STATUSES[project.status];
  const progressPercent = project.budget_allocated > 0
    ? Math.round((project.budget_used / project.budget_allocated) * 100)
    : 0;

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-all duration-200',
        onClick && 'hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-2">
            <CardTitle className="text-base leading-snug">
              {truncateText(project.title, 50)}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {truncateText(project.description, 100)}
            </CardDescription>
          </div>
          <Badge className={cn('text-xs shrink-0', status.bgColor)}>{status.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Owner */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={project.lead.avatar ?? undefined} alt={project.lead.full_name} />
            <AvatarFallback className="text-[9px] bg-[#2563EB] text-white">
              {getInitials(project.lead.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{project.lead.full_name}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {project.members?.length ?? 0} membre{(project.members?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <FolderKanban className="h-4 w-4" />
            {project.tasks_count ?? 0} tâche{(project.tasks_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Budget progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Budget utilisé
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className={cn('h-2', progressPercent > 80 && '[&>div]:bg-red-500')}
          />
        </div>

        {/* Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Début : {formatDate(project.start_date)}</span>
          {project.end_date && <span>Fin : {formatDate(project.end_date)}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
