'use client';
import { useState, useCallback } from 'react';
import { useActivityFeed } from '@/lib/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw } from 'lucide-react';
import { formatDateTime, getInitials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTION_META: Record<string, { label: string; color: string }> = {
  create:        { label: 'Création',     color: 'bg-emerald-100 text-emerald-700' },
  update:        { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
  delete:        { label: 'Suppression',  color: 'bg-red-100 text-red-700' },
  login:         { label: 'Connexion',    color: 'bg-orange-100 text-orange-700' },
  logout:        { label: 'Déconnexion', color: 'bg-gray-100 text-gray-600' },
  status_change: { label: 'Statut',       color: 'bg-violet-100 text-violet-700' },
  assign:        { label: 'Attribution',  color: 'bg-cyan-100 text-cyan-700' },
  comment:       { label: 'Commentaire',  color: 'bg-yellow-100 text-yellow-700' },
  upload:        { label: 'Upload',       color: 'bg-indigo-100 text-indigo-700' },
};

export function ActivityFeed() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useActivityFeed({
    search: debouncedSearch || undefined,
    action: actionFilter || undefined,
  });

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    const t = setTimeout(() => setDebouncedSearch(v), 400);
    return () => clearTimeout(t);
  }, []);

  const entries = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold">Activité en temps réel</CardTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
            Actualiser
          </Button>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-7 h-7 text-xs"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-7 text-xs border rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tous types</option>
            {Object.entries(ACTION_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Aucune activité</div>
        ) : (
          <div className="divide-y max-h-[480px] overflow-y-auto">
            {entries.map((entry) => {
              const meta = ACTION_META[entry.action] ?? { label: entry.action, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarImage src={entry.user?.avatar ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">
                      {getInitials(entry.user?.full_name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-medium">{entry.user?.full_name ?? 'Inconnu'}</span>{' '}
                      {entry.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <Badge className={cn('text-[10px] shrink-0', meta.color)}>{meta.label}</Badge>
                </div>
              );
            })}
            {hasNextPage && (
              <div className="py-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
