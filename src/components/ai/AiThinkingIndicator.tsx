'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Search, Globe, CheckCircle, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AiThinkingIndicatorProps {
  stage?: string;
  webSearchEnabled?: boolean;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  'Analyse de la demande…':            <Cpu className="h-3.5 w-3.5" />,
  'Recherche dans CollabSearch…':      <Search className="h-3.5 w-3.5" />,
  'Recherche web…':                    <Globe className="h-3.5 w-3.5" />,
  'Construction de la réponse…':       <Bot className="h-3.5 w-3.5" />,
  'Vérification et auto-évaluation…':  <CheckCircle className="h-3.5 w-3.5" />,
};

export function AiThinkingIndicator({ stage = 'Analyse de la demande…', webSearchEnabled }: AiThinkingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const icon = STAGE_ICONS[stage] ?? <Bot className="h-3.5 w-3.5" />;
  const isWebSearch = stage === 'Recherche web…';

  return (
    <div className="flex gap-3 max-w-[85%] mb-4 mr-auto animate-in fade-in duration-300">
      {/* Avatar */}
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full border shadow-sm shrink-0 transition-colors',
        isWebSearch
          ? 'bg-blue-100 border-blue-200 text-blue-600'
          : 'bg-gradient-to-br from-violet-100 to-indigo-100 border-violet-200 text-violet-600'
      )}>
        <Bot className="h-4 w-4 animate-pulse" />
      </div>

      {/* Bubble */}
      <div className={cn(
        'flex flex-col gap-1.5 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm',
        isWebSearch && 'bg-blue-50 border-blue-100'
      )}>
        {/* Stage indicator */}
        <div className={cn(
          'flex items-center gap-1.5 text-xs font-medium',
          isWebSearch ? 'text-blue-600' : 'text-indigo-600'
        )}>
          <span className={cn(isWebSearch && 'animate-spin')}>{icon}</span>
          <span>{stage}{dots}</span>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full animate-bounce',
                isWebSearch ? 'bg-blue-400' : 'bg-indigo-400'
              )}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
