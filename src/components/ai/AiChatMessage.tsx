'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  User, ChevronDown, ChevronRight, Brain, Sparkles,
  Shield, ShieldAlert, ShieldCheck, ExternalLink, Lightbulb, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AiSource {
  title: string;
  url: string;
}

interface AiChatMessageProps {
  sender: 'user' | 'assistant';
  text: string;
  reasoning?: string | null;
  confidence_score?: number | null;
  sources?: AiSource[] | null;
  advisor_insights?: string | null;
  is_clarification?: boolean;
  timestamp?: Date;
}

// ── Reasoning step parser ─────────────────────────────────────────────────────
function parseReasoningSteps(reasoning: string): { step: string; content: string }[] {
  const steps: { step: string; content: string }[] = [];
  const regex = /Étape\s+(\d+)\s*\(([^)]+)\)\s*:\s*([\s\S]*?)(?=Étape\s+\d+\s*\(|$)/gi;
  let match;
  while ((match = regex.exec(reasoning)) !== null) {
    steps.push({
      step: `Étape ${match[1]} (${match[2]})`,
      content: match[3].trim(),
    });
  }
  if (steps.length === 0 && reasoning.trim()) {
    steps.push({ step: 'Raisonnement', content: reasoning.trim() });
  }
  return steps;
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  let color: string, Icon: any, label: string;

  if (score >= 0.8) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = ShieldCheck;
    label = 'Confiance élevée';
  } else if (score >= 0.5) {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = Shield;
    label = 'Confiance moyenne';
  } else {
    color = 'bg-red-50 text-red-600 border-red-200';
    Icon = ShieldAlert;
    label = 'Confiance faible';
  }

  return (
    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', color)} title={label}>
      <Icon className="h-3 w-3" />
      {pct}%
    </div>
  );
}

export function AiChatMessage({
  sender,
  text,
  reasoning,
  confidence_score,
  sources,
  advisor_insights,
  is_clarification,
  timestamp,
}: AiChatMessageProps) {
  const isUser = sender === 'user';
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());

  const steps = reasoning ? parseReasoningSteps(reasoning) : [];

  const toggleStep = (idx: number) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div
      className={cn(
        'flex gap-3 max-w-[85%] mb-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm',
          isUser
            ? 'bg-primary/10 text-primary border-primary/20'
            : is_clarification
              ? 'bg-amber-100 text-amber-600 border-amber-200'
              : 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 border-violet-200'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : is_clarification ? (
          <HelpCircle className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5 min-w-0 flex-1">
        {/* Reasoning block (expandable steps) */}
        {!isUser && reasoning && steps.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setReasoningOpen(!reasoningOpen)}
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all duration-200 w-fit',
                'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/60',
                'hover:from-amber-100 hover:to-orange-100 hover:border-amber-300',
                'focus:outline-none focus:ring-2 focus:ring-amber-300/50'
              )}
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Pipeline 10 étapes</span>
              {reasoningOpen ? (
                <ChevronDown className="h-3 w-3 ml-0.5" />
              ) : (
                <ChevronRight className="h-3 w-3 ml-0.5" />
              )}
            </button>

            {reasoningOpen && (
              <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-orange-50/50 overflow-hidden animate-in slide-in-from-top-1 duration-200 shadow-inner">
                {steps.map((step, idx) => (
                  <div key={idx} className="border-b border-amber-100/50 last:border-b-0">
                    <button
                      onClick={() => toggleStep(idx)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-amber-100/40 transition-colors"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200/60 text-amber-800 text-[9px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-amber-800 flex-1 truncate">{step.step}</span>
                      {openSteps.has(idx) ? (
                        <ChevronDown className="h-3 w-3 text-amber-600 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-amber-600 shrink-0" />
                      )}
                    </button>
                    {openSteps.has(idx) && (
                      <div className="px-3 pb-2 pl-10 text-[11px] text-amber-900/70 leading-relaxed animate-in fade-in duration-150">
                        {step.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-line',
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
              : is_clarification
                ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-none'
                : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
          )}
        >
          {isUser ? (
            <p className="text-sm">{text}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm break-words prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white prose-pre:p-2 prose-pre:rounded-lg prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Advisor insights */}
        {!isUser && advisor_insights && advisor_insights.trim() && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-800">
            <Lightbulb className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <span className="font-semibold">Conseil :</span>{' '}
              {advisor_insights}
            </div>
          </div>
        )}

        {/* Sources */}
        {!isUser && sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-[10px] text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                <span className="truncate max-w-[150px]">{src.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Footer: timestamp + confidence */}
        <div className={cn('flex items-center gap-2 px-1', isUser ? 'justify-end' : 'justify-start')}>
          {!isUser && confidence_score != null && confidence_score > 0 && (
            <ConfidenceBadge score={confidence_score} />
          )}
          {timestamp && (
            <p className="text-[10px] text-muted-foreground">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
