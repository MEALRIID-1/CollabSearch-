'use client';

import { cn } from '@/lib/utils/cn';

interface RecordingIndicatorProps {
  isRecording: boolean;
  className?: string;
}

export function RecordingIndicator({ isRecording, className }: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      REC
    </div>
  );
}
