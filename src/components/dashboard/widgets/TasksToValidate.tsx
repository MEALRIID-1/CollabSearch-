'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, ClipboardCheck } from 'lucide-react';

interface Props {
  count: number;
}

export function TasksToValidate({ count }: Props) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Tâches à valider
            {count > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {count}
              </span>
            )}
          </CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-600">
              Mes projets <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm text-muted-foreground">Aucune tâche en attente de validation</p>
          </div>
        ) : (
          <div className="py-4 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-50 mb-3">
              <ClipboardCheck className="h-7 w-7 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{count}</p>
            <p className="text-sm text-muted-foreground mt-1">
              tâche{count > 1 ? 's' : ''} soumise{count > 1 ? 's' : ''} en attente de validation
            </p>
            <Link href="/projects">
              <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white text-xs h-8">
                Accéder aux projets
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
