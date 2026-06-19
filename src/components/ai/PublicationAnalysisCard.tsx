'use client';

import React from 'react';
import { BookOpen, Star, FileText, Settings, Award, Layers, Hash, ThumbsUp, ThumbsDown, Lightbulb, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeywordCloud } from './KeywordCloud';
import { cn } from '@/lib/utils/cn';

interface PublicationAnalysisCardProps {
  analysisData: {
    abstract_summary: string;
    keywords: string[];
    methodology: string;
    main_findings: string[];
    strengths?: string[];
    weaknesses?: string[];
    contribution?: string;
    limitations?: string[];
    future_work?: string;
    target_audience?: string;
    research_domain: string;
    relevance_score: number;
    related_publications: string[];
    suggested_citations: string[];
  };
}

function Section({ icon, title, children, className }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("border border-gray-100 shadow-sm", className)}>
      <CardHeader className="border-b bg-gray-50/50 py-4">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {children}
      </CardContent>
    </Card>
  );
}

function BulletList({ items, emptyLabel, color = 'blue' }: { items?: string[]; emptyLabel: string; color?: 'blue' | 'green' | 'red' | 'amber' }) {
  const dotColors = {
    blue:  'bg-blue-500',
    green: 'bg-emerald-500',
    red:   'bg-red-400',
    amber: 'bg-amber-400',
  };
  if (!items || items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
          <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", dotColors[color])} />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PublicationAnalysisCard({ analysisData }: PublicationAnalysisCardProps) {
  const score = analysisData.relevance_score || 0;
  const scoreColor = score >= 8 ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                   : score >= 6 ? 'text-blue-600 border-blue-200 bg-blue-50'
                   : 'text-amber-600 border-amber-200 bg-amber-50';

  return (
    <div className="space-y-6">

      {/* ── Row 1 : Score + Domaine + Mots-clés ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Section icon={<Star className="h-4 w-4 text-emerald-500" />} title="Points forts">
          {(analysisData.strengths?.length ?? 0) > 0 ? (
            <ul className="space-y-1.5">
              {analysisData.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-muted-foreground italic">Non renseigné.</p>}
        </Section>

        <Section icon={<Layers className="h-4 w-4 text-red-400" />} title="Points faibles">
          {(analysisData.weaknesses?.length ?? 0) > 0 ? (
            <ul className="space-y-1.5">
              {analysisData.weaknesses?.map((w, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>{w}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-muted-foreground italic">Non renseigné.</p>}
        </Section>

        <Section icon={<FileText className="h-4 w-4 text-amber-400" />} title="Limites">
          {(analysisData.limitations?.length ?? 0) > 0 ? (
            <ul className="space-y-1.5">
              {analysisData.limitations?.map((l, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">!</span>{l}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-muted-foreground italic">Non renseigné.</p>}
        </Section>
      </div>
    </div>
  );
}
