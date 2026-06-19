'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, ArrowRight } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';

export function PendingApprovals() {
  const { data } = useProjects({ page: 1, status: 'submitted' } as any);
  const projects = data?.data ?? [];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Projets en attente
            {projects.length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {projects.length}
              </span>
            )}
          </CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-600">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <FolderKanban className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            Aucun projet en attente d&apos;approbation
          </div>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <FolderKanban className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{project.title}</p>
                  <p className="text-xs text-muted-foreground">{project.lead?.full_name}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 text-[10px] shrink-0">Soumis</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
