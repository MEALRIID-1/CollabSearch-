'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const routeLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  projects: 'Projets',
  publications: 'Publications',
  calendar: 'Calendrier',
  messages: 'Messages',
  notifications: 'Notifications',
  admin: 'Administration',
  settings: 'Paramètres',
  profile: 'Profil',
  tasks: 'Tâches',
  budget: 'Budget',
  members: 'Membres',
  milestones: 'Jalons',
  create: 'Créer',
  edit: 'Modifier',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <nav aria-label="Fil d'Ariane" className="flex items-center text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        <span className="ml-2 font-medium text-foreground">Tableau de bord</span>
      </nav>
    );
  }

  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center text-sm">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            {item.isLast ? (
              <span className="font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
