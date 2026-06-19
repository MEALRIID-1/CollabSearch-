import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface AiInsightBadgeProps {
  className?: string;
  label?: string;
}

export function AiInsightBadge({ className, label = 'IA Insight' }: AiInsightBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-[#2563EB] border-[#2563EB]/25 hover:from-blue-500/20 hover:to-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold rounded-full select-none shadow-sm",
        className
      )}
    >
      <Sparkles className="h-3 w-3 text-[#2563EB] animate-pulse" />
      <span>{label}</span>
    </Badge>
  );
}
