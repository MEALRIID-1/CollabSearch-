'use client';

import { Bell } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { NotificationList } from '@/components/notifications/notification-list';

export default function NotificationsPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Restez informé de l&apos;activité de votre équipe
            </p>
          </div>
        </div>

        {/* Notifications list */}
        <NotificationList />
      </div>
    </AppLayout>
  );
}
