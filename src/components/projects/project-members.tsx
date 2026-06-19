'use client';

import { UserPlus, X, Crown, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getInitials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { USER_ROLES } from '@/lib/utils/constants';
import { projectsApi } from '@/lib/api/projects';
import { usersApi } from '@/lib/api/users';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useState, useRef, useEffect } from 'react';
import type { Project, User } from '@/types/models';

interface ProjectMembersProps {
  project: Project;
}

export function ProjectMembers({ project }: ProjectMembersProps) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOwnerOrAdmin =
    currentUser?.id === project.lead_id ||
    currentUser?.roles?.includes('administrator');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentMemberIds = new Set(project.members?.map((m) => m.id) ?? []);

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['user-search', debouncedSearch],
    queryFn: () => usersApi.list({ search: debouncedSearch, per_page: 10 } as any),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  const candidates = (searchResults?.data ?? []).filter(
    (u) => !currentMemberIds.has(u.id)
  );

  const handleRemoveMember = async (userId: number) => {
    try {
      await projectsApi.removeMember(project.id, userId);
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    } catch {
      // silenced
    }
  };

  const handleAddMember = async (user: User) => {
    setAdding(user.id);
    try {
      await projectsApi.addMember(project.id, user.id);
      setSearch('');
      setDebouncedSearch('');
      setDropdownOpen(false);
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    } catch {
      // silenced
    } finally {
      setAdding(null);
    }
  };

  const getRoleBadge = (user: User) => {
    if (user.id === project.lead_id) {
      return (
        <Badge className="text-[10px] bg-amber-100 text-amber-800">
          <Crown className="h-2.5 w-2.5 mr-0.5" />
          Chef de projet
        </Badge>
      );
    }
    if (user.custom_role?.name) {
      return (
        <Badge
          className="text-[10px] text-white"
          style={{ backgroundColor: user.custom_role.color ?? '#6b7280' }}
        >
          {user.custom_role.name}
        </Badge>
      );
    }
    const primaryRole = user.roles?.[0] as string | undefined;
    if (primaryRole && USER_ROLES[primaryRole as keyof typeof USER_ROLES]) {
      return (
        <Badge className={cn('text-[10px]', USER_ROLES[primaryRole as keyof typeof USER_ROLES].bgColor)}>
          {USER_ROLES[primaryRole as keyof typeof USER_ROLES].label}
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Membres ({project.members?.length ?? 0})
          </CardTitle>
          {isOwnerOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setSearch('');
                setDebouncedSearch('');
                setDropdownOpen(false);
              }}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">

        {showAddForm && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="relative" ref={containerRef}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              {isFetching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Input
                placeholder="Nom, spécialité ou rôle…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => debouncedSearch.length >= 2 && setDropdownOpen(true)}
                className="pl-8 pr-8"
                autoFocus
              />

              {dropdownOpen && debouncedSearch.length >= 2 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  {candidates.length === 0 && !isFetching ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Aucun résultat
                    </p>
                  ) : (
                    <ul className="max-h-56 overflow-y-auto divide-y divide-border">
                      {candidates.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            disabled={adding === u.id}
                            onClick={() => handleAddMember(u)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={u.avatar ?? undefined} alt={u.full_name} />
                              <AvatarFallback className="text-xs bg-[#2563EB] text-white">
                                {getInitials(u.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.full_name}</p>
                              {u.specialty && (
                                <p className="text-xs text-muted-foreground truncate">{u.specialty}</p>
                              )}
                            </div>
                            {u.custom_role?.name ? (
                              <Badge
                                className="text-[10px] shrink-0 text-white"
                                style={{ backgroundColor: u.custom_role.color ?? '#6b7280' }}
                              >
                                {u.custom_role.name}
                              </Badge>
                            ) : (u.roles?.[0] && USER_ROLES[u.roles[0] as keyof typeof USER_ROLES] && (
                              <Badge className={cn('text-[10px] shrink-0', USER_ROLES[u.roles[0] as keyof typeof USER_ROLES].bgColor)}>
                                {USER_ROLES[u.roles[0] as keyof typeof USER_ROLES].label}
                              </Badge>
                            ))}
                            {adding === u.id && (
                              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setSearch('');
                  setDebouncedSearch('');
                  setDropdownOpen(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {project.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.avatar ?? undefined} alt={member.full_name} />
                <AvatarFallback className="text-xs bg-[#2563EB] text-white">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {getRoleBadge(member)}
                {isOwnerOrAdmin && member.id !== project.lead_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                    aria-label={`Retirer ${member.full_name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
