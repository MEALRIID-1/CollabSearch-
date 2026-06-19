'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, MapPin, Video, Pencil, Trash2, Users, Wifi, Building2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateMeeting, useUpdateMeeting, useDeleteMeeting } from '@/lib/hooks/use-meetings';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { PermissionGate } from '@/components/shared/permission-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MEETING_STATUSES } from '@/lib/utils/constants';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useMeetingCalendar } from '@/lib/hooks/use-meetings';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { projectsApi } from '@/lib/api/projects';
import type { Meeting } from '@/types/models';
import type { User } from '@/types/models';

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ── Multi-select member picker ──────────────────────────────────────────────

interface MemberPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  users: User[];
}

function MemberPicker({ selectedIds, onChange, users }: MemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  return (
    <div className="relative" ref={ref}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); }
          if (e.key === 'Escape') setOpen(false);
        }}
        className="w-full min-h-[36px] px-3 py-1.5 text-sm border rounded-md bg-white text-left flex flex-wrap gap-1 items-center focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {selectedUsers.length === 0 ? (
          <span className="text-muted-foreground">Sélectionner des membres...</span>
        ) : (
          selectedUsers.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {u.full_name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(u.id); }}
                className="hover:text-blue-600"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-52 overflow-hidden flex flex-col">
          <div className="p-2 border-b">
            <Input
              autoFocus
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-sm"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-3">Aucun membre trouvé</p>
            ) : (
              filtered.map((u) => {
                const selected = selectedIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left',
                      selected && 'bg-blue-50'
                    )}
                  >
                    <span className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0', selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300')}>
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="flex-1 truncate">{u.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{u.email}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Meeting type toggle ────────────────────────────────────────────

interface MeetingTypeToggleProps {
  isOnline: boolean;
  onChange: (v: boolean) => void;
}

function MeetingTypeToggle({ isOnline, onChange }: MeetingTypeToggleProps) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm transition-colors',
          !isOnline ? 'bg-blue-600 text-white' : 'bg-white text-muted-foreground hover:bg-gray-50'
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        Présentiel
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm transition-colors',
          isOnline ? 'bg-blue-600 text-white' : 'bg-white text-muted-foreground hover:bg-gray-50'
        )}
      >
        <Wifi className="h-3.5 w-3.5" />
        En ligne
      </button>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────

/** Formate une Date en chaîne locale compatible avec input[type=datetime-local]
 *  (YYYY-MM-DDTHH:MM en heure locale, sans timezone) */
function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Main component ─────────────────────────────────────────────────────────────────

export function CalendarView() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: meetings, isLoading } = useMeetingCalendar(currentMonth + 1, currentYear);

  // Fetch all users for member picker
  const { data: usersData } = useQuery({
    queryKey: ['users-for-meeting-picker'],
    queryFn: () => usersApi.list({ per_page: 100 }),
    staleTime: 60_000,
  });
  const allUsers: User[] = usersData?.data ?? [];

  // Fetch projects for project selector
  const { data: projectsData } = useQuery({
    queryKey: ['projects-for-meeting-picker'],
    queryFn: () => projectsApi.list({ per_page: 100 } as any),
    staleTime: 60_000,
  });
  const allProjects = projectsData?.data ?? [];

  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const { isAdmin } = usePermissions();

  // Delete confirmation state
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

  // ── Create dialog state ──────────────────────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);

  // ── Edit dialog state ────────────────────────────────────────────────────────────────────────────
  const [meetingToEdit, setMeetingToEdit] = useState<Meeting | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editIsOnline, setEditIsOnline] = useState(false);
  const [editParticipantIds, setEditParticipantIds] = useState<number[]>([]);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);

  const openCreateForDate = (date?: Date) => {
    if (date) {
      // Pour aujourd'hui : heure courante + 1h ; sinon 09:00
      const isToday = date.toDateString() === new Date().toDateString();
      let startH = 9, startM = 0;
      if (isToday) {
        const now = new Date();
        startH = now.getHours() + 1;
        startM = 0;
        if (startH >= 24) { startH = 23; startM = 0; }
      }
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM);
      const end   = new Date(start.getTime() + 60 * 60 * 1000);
      setStartDate(toLocalDatetimeInput(start));
      setEndDate(toLocalDatetimeInput(end));
    } else {
      setStartDate(null);
      setEndDate(null);
    }
    setTitle(''); setDescription(''); setLocation(''); setLink('');
    setIsOnline(false); setParticipantIds([]); setProjectId(null);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!title || !startDate || !endDate) return;
    try {
      await createMeeting.mutateAsync({
        title,
        description,
        date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        location: location || undefined,
        link: isOnline ? (link || undefined) : undefined,
        is_online: isOnline,
        participant_ids: participantIds.length > 0 ? participantIds : undefined,
        project_id: projectId ?? undefined,
      } as any);
      setShowCreate(false);
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed creating meeting');
    }
  };

  const openEdit = (meeting: Meeting) => {
    setMeetingToEdit(meeting);
    setEditTitle(meeting.title);
    setEditDescription(meeting.description ?? '');
    setEditStartDate(meeting.date ? toLocalDatetimeInput(new Date(meeting.date)) : '');
    setEditEndDate(meeting.end_date ? toLocalDatetimeInput(new Date(meeting.end_date)) : '');
    setEditLocation(meeting.location ?? '');
    setEditLink(meeting.link ?? '');
    setEditIsOnline(meeting.is_online ?? false);
    setEditParticipantIds(meeting.participants?.map((p) => p.id) ?? []);
    setEditProjectId((meeting as any).project_id ?? null);
  };

  const handleEdit = async () => {
    if (!meetingToEdit || !editTitle || !editStartDate || !editEndDate) return;
    try {
      await updateMeeting.mutateAsync({
        id: meetingToEdit.id,
        data: {
          title: editTitle,
          description: editDescription,
          date: new Date(editStartDate).toISOString(),
          end_date: new Date(editEndDate).toISOString(),
          location: editLocation || undefined,
          link: editIsOnline ? (editLink || undefined) : undefined,
          is_online: editIsOnline,
          participant_ids: editParticipantIds.length > 0 ? editParticipantIds : undefined,
          project_id: editProjectId ?? undefined,
        } as any,
      });
      setMeetingToEdit(null);
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed updating meeting');
    }
  };

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    try {
      await deleteMeeting.mutateAsync(meetingToDelete.id);
      setMeetingToDelete(null);
    } catch {
      console.error('Failed deleting meeting');
    }
  };

  const getMeetingTimeState = (meeting: Meeting): 'upcoming' | 'ongoing' | 'ended' => {
    const now = new Date();
    const start = new Date(meeting.date);
    const end = meeting.end_date ? new Date(meeting.end_date) : null;
    if (end && now > end) return 'ended';
    if (now >= start && (!end || now <= end)) return 'ongoing';
    return 'upcoming';
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(currentYear, currentMonth, d));
    return days;
  }, [currentMonth, currentYear]);

  const getMeetingsForDate = (date: Date): Meeting[] => {
    if (!meetings) return [];
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return meetings.filter((m) => {
      const startRaw = m.date ?? '';
      if (!startRaw) return false;
      const start = new Date(startRaw);
      const end = m.end_date ? new Date(m.end_date) : null;
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : startDay;
      return targetDay >= startDay && targetDay <= endDay;
    });
  };

  const meetingCoversDate = (meeting: Meeting, date: Date) => {
    const start = new Date(meeting.date);
    const end = meeting.end_date ? new Date(meeting.end_date) : null;
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : startDay;
    return day >= startDay && day <= endDay;
  };

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isSelected = (date: Date) =>
    !!selectedDate &&
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  const goToPreviousMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDate(null);
  };

  const selectedMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendar grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {MONTHS[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex items-center gap-1">
              <PermissionGate permission="calendar.create_meeting">
                <Button variant="outline" size="sm" className="mr-2" onClick={() => openCreateForDate()}>
                  Créer réunion
                </Button>
              </PermissionGate>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setCurrentMonth(today.getMonth());
                  setCurrentYear(today.getFullYear());
                  setSelectedDate(null);
                }}
              >
                Aujourd&apos;hui
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner text="Chargement..." />
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="bg-gray-50 min-h-[80px] p-1" />;
                  }
                  const dayMeetings = getMeetingsForDate(date);
                  const covered = (meetings ?? []).some((m) => meetingCoversDate(m, date));
                  const todayClass = isToday(date) ? 'bg-blue-50' : 'bg-white';
                  const coveredClass = covered ? 'bg-[#EFF6FF]' : '';
                  const selectedClass = isSelected(date) ? 'ring-2 ring-[#2563EB] ring-inset' : '';
                  return (
                    <div
                      key={date.toISOString()}
                      className={cn('min-h-[80px] p-1 cursor-pointer transition-colors hover:bg-gray-50', todayClass, coveredClass, selectedClass)}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span
                        className={cn(
                          'text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full',
                          isToday(date) && 'bg-[#2563EB] text-white'
                        )}
                      >
                        {date.getDate()}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayMeetings.slice(0, 2).map((meeting) => (
                          <div
                            key={meeting.id}
                            className={cn(
                              'text-[10px] truncate px-1 py-0.5 rounded font-medium flex items-center gap-0.5',
                              meeting.is_online
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-[#2563EB]/10 text-[#2563EB]'
                            )}
                          >
                            {meeting.is_online
                              ? <Wifi className="h-2.5 w-2.5 shrink-0" />
                              : <Building2 className="h-2.5 w-2.5 shrink-0" />
                            }
                            <span className="truncate">{meeting.title}</span>
                          </div>
                        ))}
                        {dayMeetings.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">
                            +{dayMeetings.length - 2} autre{dayMeetings.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected date meetings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {selectedDate ? `Réunions du ${formatDate(selectedDate)}` : 'Sélectionnez une date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Cliquez sur un jour pour voir les réunions
            </p>
          ) : selectedMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune réunion ce jour
            </p>
          ) : (
            <div className="space-y-3">
              {selectedMeetings.map((meeting) => {
                const statusInfo = MEETING_STATUSES[meeting.status];
                const timeState = getMeetingTimeState(meeting);
                return (
                  <div key={meeting.id} className="p-3 rounded-lg border space-y-2">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium flex-1">{meeting.title}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge className={cn('text-[10px]', statusInfo.bgColor)}>
                          {statusInfo.label}
                        </Badge>
                        <PermissionGate permission={['calendar.edit_any_meeting', 'calendar.edit_own_meeting']}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEdit(meeting)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </PermissionGate>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-red-50"
                            onClick={() => setMeetingToDelete(meeting)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Meeting type badge */}
                    <div>
                      {meeting.is_online ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          <Wifi className="h-2.5 w-2.5" /> En ligne
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          <Building2 className="h-2.5 w-2.5" /> Présentiel
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {meeting.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {meeting.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(meeting.date)}
                        {meeting.end_date ? ` → ${formatDateTime(meeting.end_date)}` : ''}
                      </span>
                      {(meeting as any).project && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          {(meeting as any).project}
                        </span>
                      )}
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {meeting.location}
                        </span>
                      )}
                    </div>

                    {/* Participants */}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{meeting.participants.length} participant{meeting.participants.length > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Time-aware action */}
                    {meeting.status !== 'cancelled' && (
                      <div className="pt-2 border-t border-gray-100">
                        {/* Online meeting: show join button when ongoing */}
                        {meeting.is_online && timeState === 'ongoing' && (
                          <Button
                            asChild
                            className="w-full text-xs bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
                          >
                            <Link href={`/meetings/${meeting.id}/room`}>
                              <Video className="h-3.5 w-3.5 mr-1" />
                              Rejoindre la réunion
                            </Link>
                          </Button>
                        )}

                        {/* In-person meeting: show label */}
                        {!meeting.is_online && timeState === 'ongoing' && (
                          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded py-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            Réunion en présentiel
                          </div>
                        )}

                        {/* Online meeting upcoming */}
                        {meeting.is_online && timeState === 'upcoming' && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
                            <Clock className="h-3 w-3" />
                            Lien disponible au démarrage
                          </div>
                        )}

                        {timeState === 'ended' && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                            Réunion terminée
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create meeting dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Créer une réunion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de réunion</Label>
              <MeetingTypeToggle isOnline={isOnline} onChange={setIsOnline} />
            </div>

            <div className="space-y-2">
              <Label>Titre <span className="text-red-500">*</span></Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la réunion" />
            </div>

            <div className="space-y-2">
              <Label>Projet associé</Label>
              <select
                value={projectId ?? ''}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 px-3 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Aucun projet —</option>
                {allProjects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Début <span className="text-red-500">*</span></Label>
                <Input type="datetime-local" value={startDate ?? ''} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fin <span className="text-red-500">*</span></Label>
                <Input type="datetime-local" value={endDate ?? ''} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {!isOnline && (
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Salle, adresse..." />
              </div>
            )}

            {isOnline && (
              <div className="space-y-2">
                <Label>Lien de visioconférence</Label>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Inviter des membres</Label>
              <MemberPicker selectedIds={participantIds} onChange={setParticipantIds} users={allUsers} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button
              onClick={handleCreate}
              disabled={createMeeting.isPending || !title || !startDate || !endDate}
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            >
              {createMeeting.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit meeting dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!meetingToEdit} onOpenChange={(open) => { if (!open) setMeetingToEdit(null); }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Modifier la réunion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de réunion</Label>
              <MeetingTypeToggle isOnline={editIsOnline} onChange={setEditIsOnline} />
            </div>

            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Projet associé</Label>
              <select
                value={editProjectId ?? ''}
                onChange={(e) => setEditProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 px-3 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Aucun projet —</option>
                {allProjects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Début</Label>
                <Input type="datetime-local" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="datetime-local" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
              </div>
            </div>

            {!editIsOnline && (
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
            )}

            {editIsOnline && (
              <div className="space-y-2">
                <Label>Lien de visioconférence</Label>
                <Input value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder="https://meet.google.com/..." />
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Participants</Label>
              <MemberPicker selectedIds={editParticipantIds} onChange={setEditParticipantIds} users={allUsers} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMeetingToEdit(null)}>Annuler</Button>
            <Button onClick={handleEdit} disabled={updateMeeting.isPending}>
              {updateMeeting.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!meetingToDelete} onOpenChange={(open) => { if (!open) setMeetingToDelete(null); }}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Supprimer la réunion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Voulez-vous vraiment supprimer <span className="font-medium text-foreground">&ldquo;{meetingToDelete?.title}&rdquo;</span> ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMeetingToDelete(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMeeting.isPending}
            >
              {deleteMeeting.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
