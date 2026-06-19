import React from 'react';
import { Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface AnalysisStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed' | undefined;
  errorMessage?: string | null;
  className?: string;
}

export function AnalysisStatus({ status, errorMessage, className }: AnalysisStatusProps) {
  if (!status) return null;

  const config = {
    pending: {
      label: 'En attente...',
      icon: RefreshCw,
      iconClass: 'animate-spin',
      colorClass: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    processing: {
      label: 'Analyse en cours...',
      icon: RefreshCw,
      iconClass: 'animate-spin',
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    completed: {
      label: 'Analysé par IA',
      icon: CheckCircle2,
      iconClass: '',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    failed: {
      label: 'Analyse échouée',
      icon: AlertCircle,
      iconClass: '',
      colorClass: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border rounded-full shadow-sm",
          current.colorClass
        )}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", current.iconClass)} />
        <span>{current.label}</span>
      </Badge>
      {status === 'failed' && errorMessage && (
        <p className="text-[10px] text-red-500 font-medium max-w-xs leading-normal">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
