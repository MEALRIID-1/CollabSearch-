import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/lib/stores/notification-store';

export function useNotifications(params?: { page?: number }) {
  const { fetchNotifications, notifications, isLoading } = useNotificationStore();
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      await fetchNotifications();
      return notifications;
    },
  });
}

export function useUnreadCount() {
  const { fetchUnreadCount, unreadCount } = useNotificationStore();
  useQuery({
    queryKey: ['unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });
  return unreadCount;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  return useMutation({
    mutationFn: (id: number) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
