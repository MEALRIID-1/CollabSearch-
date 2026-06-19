'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2, ListTodo, CalendarClock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionItemsList } from './ActionItemsList';
import { cn } from '@/lib/utils/cn';

interface MeetingSummaryCardProps {
  summaryData: {
    summary: string;
    key_decisions: string[];
    action_items: Array<{ task: string; assignee: string; deadline: string }>;
    next_meeting_agenda: string[];
    participants_summary?: {
      present_names: string[];
      key_contributors: string[];
    };
  };
}

export function MeetingSummaryCard({ summaryData }: MeetingSummaryCardProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    decisions: true,
    actions: true,
    agenda: false,
    participants: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = [
    {
      id: 'summary',
      title: 'Résumé exécutif',
      icon: FileText,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50/50',
      content: <p className="text-sm text-gray-700 leading-relaxed">{summaryData.summary}</p>,
    },
    {
      id: 'decisions',
      title: 'Décisions clés',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50/30',
      content: (
        <ul className="space-y-2">
          {summaryData.key_decisions?.length > 0 ? (
            summaryData.key_decisions.map((decision, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2"></span>
                <span>{decision}</span>
              </li>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">Aucune décision consignée.</p>
          )}
        </ul>
      ),
    },
    {
      id: 'actions',
      title: 'Actions à mener',
      icon: ListTodo,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-50/30',
      content: <ActionItemsList items={summaryData.action_items} />,
    },
    {
      id: 'agenda',
      title: 'Ordre du jour suivant',
      icon: CalendarClock,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50/30',
      content: (
        <ul className="space-y-2">
          {summaryData.next_meeting_agenda?.length > 0 ? (
            summaryData.next_meeting_agenda.map((agenda, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-2"></span>
                <span>{agenda}</span>
              </li>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">Aucun ordre du jour fixé pour la suite.</p>
          )}
        </ul>
      ),
    },
    {
      id: 'participants',
      title: 'Participants',
      icon: Users,
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-50/30',
      content: (
        <div className="space-y-3 text-sm">
          {summaryData.participants_summary?.present_names && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Présents</p>
              <div className="flex flex-wrap gap-1.5">
                {summaryData.participants_summary.present_names.map((name, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {summaryData.participants_summary?.key_contributors && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contributeurs principaux</p>
              <div className="flex flex-wrap gap-1.5">
                {summaryData.participants_summary.key_contributors.map((name, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const Icon = section.icon;
        const isSectionOpen = openSections[section.id];
        return (
          <Card key={section.id} className="overflow-hidden border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 text-left font-medium transition-colors hover:bg-gray-50/50",
                section.bgColor
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 shrink-0", section.iconColor)} />
                <span className="text-sm font-semibold text-gray-900">{section.title}</span>
              </div>
              {isSectionOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              )}
            </button>
            <div
              className={cn(
                "transition-all duration-300 overflow-hidden",
                isSectionOpen ? "max-h-[1000px] border-t" : "max-h-0"
              )}
            >
              <div className="p-6">{section.content}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
