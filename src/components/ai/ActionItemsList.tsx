import React from 'react';
import { Calendar, User, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface ActionItem {
  task: string;
  assignee: string;
  deadline: string;
}

interface ActionItemsListProps {
  items: ActionItem[];
  className?: string;
}

export function ActionItemsList({ items, className }: ActionItemsListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <ClipboardList className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-xs text-muted-foreground italic">Aucune action assignée.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors shadow-sm"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 leading-snug">{item.task}</p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Assignee Badge */}
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50/30 text-blue-700 border-blue-100 text-[10px] px-2 py-0.5 font-medium rounded-full">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{item.assignee || 'Non assigné'}</span>
            </Badge>

            {/* Deadline Badge */}
            <Badge variant="outline" className="flex items-center gap-1 bg-amber-50/30 text-amber-700 border-amber-100 text-[10px] px-2 py-0.5 font-medium rounded-full">
              <Calendar className="h-3 w-3" />
              <span>{item.deadline || 'Non spécifiée'}</span>
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
