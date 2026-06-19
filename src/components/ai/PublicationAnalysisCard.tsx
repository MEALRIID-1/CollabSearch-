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

        {/* Score */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Score de pertinence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-5">
            <div className={cn("flex items-baseline justify-center h-24 w-24 rounded-full border-4 shadow-inner", scoreColor)}>
              <span className="text-3xl font-extrabold">{score.toFixed(1)}</span>
              <span className="text-xs font-normal text-gray-400 ml-0.5">/10</span>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3 leading-normal px-2">
              Score IA basé sur la qualité, la rigueur et la contribution scientifique estimée.
            </p>
          </CardContent>
        </Card>

        {/* Domaine */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              Domaine & Public cible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Domaine scientifique</p>
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-medium px-3 py-1 text-xs rounded-lg">
                {analysisData.research_domain || "Multidisciplinaire"}
              </Badge>
            </div>
            {analysisData.target_audience && (
              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Public cible</p>
                <p className="text-xs text-gray-600 leading-relaxed">{analysisData.target_audience}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mots-clés */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-blue-500" />
              Mots-clés extraits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KeywordCloud keywords={analysisData.keywords} />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2 : Résumé + Contribution ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={<BookOpen className="h-4 w-4 text-blue-500" />} title="Résumé des travaux">
          <p className="text-sm text-gray-700 leading-relaxed">
            {analysisData.abstract_summary || "Résumé non disponible."}
          </p>
        </Section>

        <Section icon={<TrendingUp className="h-4 w-4 text-blue-500" />} title="Contribution scientifique">
          <p className="text-sm text-gray-700 leading-relaxed">
            {analysisData.contribution || "Contribution non identifiée."}
          </p>
          {analysisData.future_work && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Perspectives futures
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{analysisData.future_work}</p>
            </div>
          )}
        </Section>
      </div>

      {/* ── Row 3 : Méthodologie + Découvertes ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={<Settings className="h-4 w-4 text-blue-500" />} title="Méthodologie">
          <p className="text-sm text-gray-700 leading-relaxed">
            {analysisData.methodology || "Méthodologie non explicitement spécifiée."}
          </p>
        </Section>

        <Section icon={<Award className="h-4 w-4 text-blue-500" />} title="Découvertes & Résultats majeurs">
          {analysisData.main_findings?.length > 0 ? (
            <ul className="space-y-2.5">
              {analysisData.main_findings.map((finding, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{finding}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">Aucune découverte listée.</p>
          )}
        </Section>
      </div>

      {/* ── Row 4 : Points forts / Points faibles / Limites ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Section icon={<ThumbsUp className="h-4 w-4 text-emerald-500" />} title="Points forts">
          <BulletList items={analysisData.strengths} emptyLabel="Non identifiés." color="green" />
        </Section>

        <Section icon={<ThumbsDown className="h-4 w-4 text-red-400" />} title="Points faibles">
          <BulletList items={analysisData.weaknesses} emptyLabel="Aucun point faible identifié." color="red" />
        </Section>

        <Section icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} title="Limites">
          <BulletList items={analysisData.limitations} emptyLabel="Limites non spécifiées." color="amber" />
        </Section>
      </div>

      {/* ── Row 5 : Lectures suggérées + Citation ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={<BookOpen className="h-4 w-4 text-blue-500" />} title="Lectures suggérées">
          <BulletList items={analysisData.related_publications} emptyLabel="Aucune suggestion." color="blue" />
        </Section>

        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="border-b bg-gray-50/50 py-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Citation APA suggérée
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {analysisData.suggested_citations?.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200 select-all cursor-text">
                <p className="text-xs font-mono text-gray-600 leading-relaxed break-words">
                  {analysisData.suggested_citations[0]}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucune citation générée.</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
