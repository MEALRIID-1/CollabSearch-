'use client';

import React, { useEffect } from 'react';
import { Brain, Trash2, Plus, Settings, Target, Cpu, Gavel, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { AiMemoryItem } from '@/lib/api/ai';

interface AiMemoryPanelProps {
  items: AiMemoryItem[];
  loading: boolean;
  onDelete: (id: number) => void;
  onLoad: () => void;
}

const CATEGORY_CONFIG = {
  preference: { label: 'Préférences', Icon: Settings,  color: 'bg-blue-50 text-blue-700 border-blue-200',   dot: 'bg-blue-400' },
  technology:  { label: 'Technologies', Icon: Cpu,      color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-400' },
  decision:    { label: 'Décisions',    Icon: Gavel,    color: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  objective:   { label: 'Objectifs',    Icon: Target,   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
} as const;

export function AiMemoryPanel({ items, loading, onDelete, onLoad }: AiMemoryPanelProps) {
  useEffect(() => {
    onLoad();
  }, [onLoad]);

  const grouped = items.reduce<Record<string, AiMemoryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white/80 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-800">Mémoire IA</h3>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-medium">
            {items.length} élément{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 leading-snug">
          L'IA mémorise automatiquement vos préférences, technologies et décisions pour enrichir ses réponses.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Brain className="h-8 w-8 text-indigo-200 animate-pulse" />
            <p className="text-xs text-gray-400">Chargement de la mémoire…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 border border-dashed border-gray-200">
              <Brain className="h-7 w-7 text-gray-300" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Mémoire vide</p>
              <p className="text-[10px] text-gray-400 mt-0.5 max-w-[180px] leading-relaxed">
                Discutez avec l'IA pour qu'elle commence à mémoriser vos préférences automatiquement.
              </p>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([category, categoryItems]) => {
            const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
            if (!cfg) return null;
            const { label, Icon, color, dot } = cfg;

            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={cn('h-2 w-2 rounded-full', dot)} />
                  <Icon className="h-3 w-3 text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
                  <span className="text-[9px] text-gray-400 ml-auto">{categoryItems.length}</span>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex items-start gap-2 px-3 py-2 rounded-lg border text-xs transition-all',
                        color
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.key.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] opacity-80 leading-relaxed mt-0.5 line-clamp-2">{item.value}</p>
                      </div>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-all shrink-0 mt-0.5"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      {items.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50/80 shrink-0">
          <p className="text-[9px] text-gray-400 text-center leading-snug">
            Survolez un élément pour le supprimer. L'IA apprend au fil de vos conversations.
          </p>
        </div>
      )}
    </div>
  );
}
