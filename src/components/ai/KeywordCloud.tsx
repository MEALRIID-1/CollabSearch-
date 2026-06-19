import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface KeywordCloudProps {
  keywords: string[];
  className?: string;
}

export function KeywordCloud({ keywords, className }: KeywordCloudProps) {
  if (!keywords || keywords.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Aucun mot-clé.</p>;
  }

  // Predefined modern badge color classes to loop through
  const styles = [
    'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50',
    'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50',
    'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100/50',
    'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50',
    'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100/50',
    'bg-cyan-50 text-cyan-700 border-cyan-100 hover:bg-cyan-100/50',
  ];

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {keywords.map((kw, idx) => {
        const styleClass = styles[idx % styles.length];
        return (
          <Badge
            key={idx}
            variant="outline"
            className={cn("px-2.5 py-0.5 text-xs font-medium border rounded-full transition-all duration-300", styleClass)}
          >
            {kw}
          </Badge>
        );
      })}
    </div>
  );
}
