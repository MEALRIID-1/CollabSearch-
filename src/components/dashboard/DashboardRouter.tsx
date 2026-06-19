'use client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AdminDashboard } from './AdminDashboard';
import { TeamLeadDashboard } from './TeamLeadDashboard';
import { ResearcherDashboard } from './ResearcherDashboard';
import { InstitutionDashboard } from './InstitutionDashboard';

export function DashboardRouter() {
  const user = useAuthStore((s) => s.user);
  const roles: string[] = user?.roles ?? [];

  // Priorité : admin > institution > team_lead > researcher
  if (roles.includes('administrator')) return <AdminDashboard />;
  if (roles.includes('institution'))   return <InstitutionDashboard />;
  if (roles.includes('team_lead'))     return <TeamLeadDashboard />;

  // researcher / fallback
  return <ResearcherDashboard userId={user?.id} />;
}
