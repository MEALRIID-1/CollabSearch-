'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Clock, FileText, Play, Sparkles,
  Download, Loader2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiApi, type AiAnalysisResponse } from '@/lib/api/ai';
import type { VideoConferenceRecording } from '@/types/video-conference';
import type { Meeting } from '@/types/models';

interface MeetingEndScreenProps {
  meetingId: number;
  meeting: Meeting;
  recording?: VideoConferenceRecording | null;
  onClose: () => void;
}

function downloadAccountPDF(meeting: Meeting, analysis: AiAnalysisResponse, recording?: VideoConferenceRecording | null) {
  const result = analysis.result ?? {};
  const summary = result.summary ?? result.meeting_summary ?? recording?.meeting_summary ?? '';
  const keyPoints: string[] = result.key_points ?? result.points ?? [];
  const actionItems: string[] = result.action_items ?? result.actions ?? [];
  const transcript = recording?.recording_transcript ?? '';
  const duration = recording?.actual_duration_minutes;

  const scheduledAt = meeting.date ?? '';
  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const participants: any[] = meeting.participants ?? [];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Compte rendu — ${meeting.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a202c; padding: 40px 50px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left h1 { font-size: 22px; font-weight: 700; color: #1e3a8a; margin-bottom: 4px; }
    .header-left p { color: #64748b; font-size: 12px; }
    .badge { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .meta-item label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; }
    .meta-item span { font-weight: 500; color: #1e293b; }
    section { margin-bottom: 24px; }
    section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    .summary-box { background: #f0f4ff; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 0 6px 6px 0; color: #1e293b; white-space: pre-wrap; }
    ul { padding-left: 20px; }
    ul li { margin-bottom: 6px; color: #334155; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 10px; border-radius: 20px; font-size: 12px; color: #334155; }
    .transcript-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #475569; white-space: pre-wrap; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px 30px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${meeting.title}</h1>
      <p>Compte rendu de réunion — généré par CollabSearch IA</p>
    </div>
    <span class="badge">Analyse IA</span>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><label>Date</label><span>${dateStr}</span></div>
    <div class="meta-item"><label>Durée</label><span>${duration != null ? duration + ' minutes' : '—'}</span></div>
    <div class="meta-item"><label>Type</label><span>${meeting.is_online ? 'En ligne' : 'Présentiel'}</span></div>
    <div class="meta-item"><label>Lieu / Lien</label><span>${meeting.location ?? meeting.link ?? '—'}</span></div>
  </div>

  ${meeting.description ? `<section><h2>Description</h2><p>${meeting.description}</p></section>` : ''}

  ${participants.length > 0 ? `<section><h2>Participants (${participants.length})</h2><div class="chips">${participants.map((p: any) => `<span class="chip">${p.full_name ?? p.name ?? 'Participant'}</span>`).join('')}</div></section>` : ''}

  ${summary ? `<section><h2>Résumé IA</h2><div class="summary-box">${summary}</div></section>` : ''}

  ${keyPoints.length > 0 ? `<section><h2>Points clés</h2><ul>${keyPoints.map((p: string) => `<li>${p}</li>`).join('')}</ul></section>` : ''}

  ${actionItems.length > 0 ? `<section><h2>Actions à suivre</h2><ul>${actionItems.map((a: string) => `<li>${a}</li>`).join('')}</ul></section>` : ''}

  ${transcript ? `<section><h2>Transcription</h2><div class="transcript-box">${transcript}</div></section>` : ''}

  <div class="footer">
    <span>CollabSearch — Compte rendu généré automatiquement</span>
    <span>Généré le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
  setTimeout(() => { try { win.print(); } catch { /* ignore */ } }, 600);
}

export function MeetingEndScreen({ meetingId, meeting, recording, onClose }: MeetingEndScreenProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResponse | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  const hasRecording = !!recording?.recording_url;
  const hasSummary = !!recording?.meeting_summary;
  const hasTranscript = !!recording?.recording_transcript;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await aiApi.analyzeMeeting(meetingId);
      setAnalysis(res.analysis);
    } catch (err: any) {
      setAnalyzeError(err?.response?.data?.message ?? "Erreur lors de l'analyse. Réessayez.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Convertit un élément qui peut être string ou objet en string lisible
  const toStr = (item: unknown): string => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      // Formats courants retournés par l'IA
      if (o.task) return [String(o.task), o.assignee ? '(' + String(o.assignee) + ')' : '', o.deadline ? '— ' + String(o.deadline) : ''].filter(Boolean).join(' ');
      if (o.point) return String(o.point);
      if (o.text) return String(o.text);
      if (o.description) return String(o.description);
      return Object.values(o).filter(Boolean).join(' — ');
    }
    return String(item ?? '');
  };

  const getContent = () => {
    if (!analysis?.result) return null;
    const r = analysis.result;
    const rawPoints: unknown[] = r.key_points ?? r.points ?? [];
    const rawActions: unknown[] = r.action_items ?? r.actions ?? [];
    return {
      summary: r.summary ?? r.meeting_summary ?? recording?.meeting_summary ?? '',
      keyPoints: rawPoints.map(toStr),
      actionItems: rawActions.map(toStr),
    };
  };
  const content = getContent();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-2xl rounded-2xl border bg-white shadow-xl overflow-hidden">

        {/* En-tête */}
        <div className="flex flex-col items-center px-8 pt-10 pb-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Réunion terminée</h1>
          <p className="mt-1 text-muted-foreground font-medium">{meeting.title}</p>
          {recording?.actual_duration_minutes != null && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Durée : {recording.actual_duration_minutes} min
            </div>
          )}
        </div>

        {/* Résumé / transcription existants */}
        {(hasSummary || hasTranscript || hasRecording) && (
          <div className="border-t px-8 py-5 space-y-4">
            {hasSummary && (
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                <div className="flex items-center gap-2 text-violet-700 font-medium text-sm mb-2">
                  <Sparkles className="h-4 w-4" /> Résumé IA
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{recording!.meeting_summary}</p>
              </div>
            )}
            {hasTranscript && (
              <div className="rounded-xl bg-gray-50 border p-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium text-sm mb-2">
                  <FileText className="h-4 w-4" /> Transcription
                </div>
                <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">{recording!.recording_transcript}</p>
              </div>
            )}
            {hasRecording && (
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href={`/meetings/${meetingId}/replay`}>
                  <Play className="h-4 w-4" /> Voir l&apos;enregistrement
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Section Analyse IA */}
        <div className="border-t px-8 py-5">
          {!analysis && !isAnalyzing && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Obtenez un compte rendu structuré généré par l&apos;IA à partir de cette réunion.
              </p>
              <Button onClick={handleAnalyze} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" disabled={isAnalyzing}>
                <Sparkles className="h-4 w-4" /> Analyser la réunion
              </Button>
              {analyzeError && (
                <div className="flex items-center gap-2 text-sm text-red-600 justify-center">
                  <AlertCircle className="h-4 w-4" />{analyzeError}
                </div>
              )}
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
              <p className="text-sm">Analyse IA en cours…</p>
            </div>
          )}

          {analysis && content && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-700 font-semibold text-sm">
                  <Sparkles className="h-4 w-4" /> Compte rendu IA
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                  onClick={() => downloadAccountPDF(meeting, analysis, recording)}>
                  <Download className="h-3.5 w-3.5" /> Télécharger PDF
                </Button>
              </div>

              {content.summary && (
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                  <p className="text-xs font-semibold uppercase text-violet-500 mb-2">Résumé</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{content.summary}</p>
                </div>
              )}

              {content.keyPoints.length > 0 && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-semibold uppercase text-blue-500 mb-2">Points clés</p>
                  <ul className="space-y-1">
                    {content.keyPoints.map((pt, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>{pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {content.actionItems.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <p className="text-xs font-semibold uppercase text-amber-600 mb-2">Actions à suivre</p>
                  <ul className="space-y-1">
                    {content.actionItems.map((a, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-amber-500 mt-0.5">→</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.result && Object.keys(analysis.result).length > 0 && (
                <div>
                  <button onClick={() => setShowFull((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {showFull ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showFull ? 'Masquer les données brutes' : 'Voir les données complètes'}
                  </button>
                  {showFull && (
                    <pre className="mt-2 text-[11px] bg-gray-50 border rounded-lg p-3 overflow-auto max-h-48 text-gray-600">
                      {JSON.stringify(analysis.result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center gap-3 border-t bg-gray-50 px-8 py-5">
          <Button variant="outline" onClick={onClose} className="flex-1">Retour au calendrier</Button>
          {analysis && (
            <Button variant="ghost" className="gap-1.5 text-violet-600 hover:bg-violet-50"
              onClick={handleAnalyze} disabled={isAnalyzing}>
              <Sparkles className="h-4 w-4" /> Ré-analyser
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
