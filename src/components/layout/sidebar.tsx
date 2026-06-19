'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Calendar,
  MessageSquare,
  Bell,
  Shield,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { APP_NAME } from '@/lib/utils/constants';
import { getInitials } from '@/lib/utils/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Si defini, l'utilisateur doit avoir AU MOINS UNE de ces permissions (ou etre admin). */
  permissions?: string[];
  /** Si true, item visible uniquement pour les administrateurs Spatie. */
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    // Toujours visible
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: FolderKanban,
    permissions: ['projects.view_list'],
  },
  {
    label: 'Publications',
    href: '/publications',
    icon: BookOpen,
    permissions: ['publications.view_list'],
  },
  {
    label: 'Calendrier',
    href: '/calendar',
    icon: Calendar,
    permissions: ['calendar.view'],
  },
  {
    label: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
    permissions: ['users.view_list'],
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    permissions: ['messages.send_direct', 'messages.send_group'],
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    permissions: ['notifications.view'],
  },
  {
    label: 'Assistant IA',
    href: '/ai-assistant',
    icon: Sparkles,
    permissions: ['ai.use_chat_assistant'],
  },
  {
    label: 'Roles & permissions',
    href: '/admin/roles',
    icon: Shield,
    adminOnly: true,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { can, hasAny, isAdmin, hasNoCustomRole } = usePermissions();

  const filteredNavItems = navItems.filter((item) => {
    // Items reserved for Spatie administrators only
    if (item.adminOnly) return isAdmin;

    // Items with no permission requirement are always visible
    if (!item.permissions || item.permissions.length === 0) return true;

    // Admins bypass all checks
    if (isAdmin) return true;

    // Users with no custom role yet get access to all base modules
    if (hasNoCustomRole) return true;

    // Otherwise check permissions
    return hasAny(item.permissions);
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname.startsWith('/dashboard');
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen text-white transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
        style={{ background: 'linear-gradient(180deg, #2e2065 0%, #3b2882 55%, #4c32a0 100%)' }}
      >
        {/* Logo / App Name */}
        <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: '#5b3fa8' }}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Search className="h-7 w-7 text-white" />
              <span className="text-lg font-bold tracking-tight text-white">{APP_NAME}</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <Search className="h-7 w-7 text-white" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Developper le menu' : 'Reduire le menu'}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-white/15 text-white ring-1 ring-white/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.href}>{linkContent}</li>;
            })}
          </ul>
        </nav>

        {/* User Info */}
        <Separator style={{ backgroundColor: '#5b3fa8' }} />
        <div className={cn('p-3 flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.avatar ?? undefined} alt={user?.full_name ?? ''} />
            <AvatarFallback className="bg-white/20 text-white text-xs">
              {user ? getInitials(user.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.full_name ?? 'Utilisateur'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email ?? ''}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-300 hover:bg-white/10 shrink-0"
              onClick={() => logout()}
              aria-label="Se deconnecter"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-300 hover:bg-white/10"
                  onClick={() => logout()}
                  aria-label="Se deconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Se deconnecter</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
