'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { CalendarView } from '@/components/calendar/calendar-view';

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground mt-1">
            Planifiez et suivez vos réunions
          </p>
        </div>

        {/* Calendar view */}
        <CalendarView />
      </div>
    </AppLayout>
  );
}
