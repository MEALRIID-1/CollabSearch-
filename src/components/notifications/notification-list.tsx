'use client';

import { Bell, Check, CheckCheck, FileText, MessageSquare, Calendar, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import { formatRelative } from '@/lib/utils/format';
import { useNotificationStore } from '@/lib/stores/notification-store';
import type { Notification } from '@/types/models';

const notificationIcons: Record<string, React.ElementType> = {
  'task-assigned': FileText,
  'new-message': MessageSquare,
  'meeting-invitation': Calendar,
  'budget-alert': DollarSign,
  'project-status-changed': AlertTriangle,
  'publication-mentioned': FileText,
};

const notificationColors: Record<string, string> = {
  'task-assigned': 'text-[#2563EB] bg-blue-50',
  'new-message': 'text-[#10B981] bg-emerald-50',
  'meeting-invitation': 'text-[#f59e0b] bg-amber-50',
  'budget-alert': 'text-[#ef4444] bg-red-50',
  'project-status-changed': 'text-[#8b5cf6] bg-violet-50',
  'publication-mentioned': 'text-[#2563EB] bg-blue-50',
};

export function NotificationList() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch {
      // Error handled silently
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch {
      // Error handled silently
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-[#ef4444] text-white text-[10px] px-1.5">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#2563EB] hover:text-[#2563EB]"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-1">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] ?? Bell;
                const colorClass = notificationColors[notification.type] ?? 'text-gray-500 bg-gray-50';

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg transition-colors',
                      !notification.read && 'bg-blue-50/50 border-l-2 border-[#2563EB]',
                      notification.read && 'hover:bg-muted/50'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm', !notification.read && 'font-medium')}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatRelative(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    {/* Mark as read */}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-[#2563EB]"
                        onClick={() => handleMarkAsRead(notification.id)}
                        aria-label="Marquer comme lu"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
