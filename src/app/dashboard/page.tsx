'use client';
import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardRouter } from '@/components/dashboard/DashboardRouter';
import { useCurrentUser } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function DashboardPage() {
  const { user, isLoading } = useCurrentUser();
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement du tableau de bord…" size="lg" />
        </div>
      </AppLayout>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {user?.first_name || user?.full_name} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Voici votre tableau de bord personnalisé
          </p>
        </div>

        <DashboardRouter />
      </div>
    </AppLayout>
  );
}
