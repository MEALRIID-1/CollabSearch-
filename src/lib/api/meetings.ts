import apiClient from './client';
import type { Meeting } from '@/types/models';
import type { CreateMeetingRequest, PaginatedResponse } from '@/types/api';

function normalizeMeeting(raw: any): Meeting {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.agenda ?? raw.description ?? '',
    date: raw.scheduled_at ?? raw.date,
    end_date: raw.ended_at ?? raw.end_date ?? '',
    location: raw.location ?? null,
    link: raw.meeting_url ?? raw.link ?? null,
    is_online: raw.is_online === true || raw.is_online === 1,
    status: raw.status,
    organizer_id: raw.organizer_id ?? raw.organizer?.id ?? 0,
    organizer: raw.organizer ?? ({} as any),
    participants: raw.participants ?? [],
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  } as Meeting;
}

export const meetingsApi = {
  async list(params?: { page?: number; status?: string }): Promise<PaginatedResponse<Meeting>> {
    const response = await apiClient.get('/api/v1/meetings', { params });
    const items = response.data.meetings ?? response.data.data ?? [];
    const meta = response.data.meta ?? {};
    return {
      data: items.map((m: any) => normalizeMeeting(m)),
      meta: {
        current_page: meta.current_page ?? 1,
        last_page: meta.last_page ?? 1,
        per_page: meta.per_page ?? 15,
        total: meta.total ?? (Array.isArray(items) ? items.length : 0),
        from: meta.from ?? 1,
        to: meta.to ?? (Array.isArray(items) ? items.length : 0),
      },
      links: response.data.links ?? { first: '', last: '', prev: null, next: null },
    };
  },

  async get(id: number): Promise<Meeting> {
    const response = await apiClient.get(`/api/v1/meetings/${id}`);
    const raw = response.data.meeting ?? response.data.data;
    return normalizeMeeting(raw);
  },

  async create(data: CreateMeetingRequest): Promise<Meeting> {
    const payload = {
      title: data.title,
      agenda: (data as any).agenda ?? (data as any).description ?? undefined,
      project_id: (data as any).project_id ?? undefined,
      scheduled_at: (data as any).scheduled_at ?? (data as any).date ?? (data as any).start_date ?? undefined,
      ended_at: (data as any).ended_at ?? (data as any).end_date ?? (data as any).end ?? undefined,
      location: (data as any).location ?? undefined,
      meeting_url: (data as any).meeting_url ?? (data as any).link ?? undefined,
      is_online: (data as any).is_online ?? false,
      participant_ids: (data as any).participant_ids ?? (data as any).participants ?? undefined,
    };
    // eslint-disable-next-line no-console
    console.log('Meeting POST payload:', payload);
    try {
      const response = await apiClient.post('/api/v1/meetings', payload);
      const raw = response.data.meeting ?? response.data.data;
      return normalizeMeeting(raw);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Meeting create failed with status:', err?.response?.status);
      // eslint-disable-next-line no-console
      console.error('Validation errors:', err?.response?.data?.errors ?? err?.response?.data);
      throw err;
    }
  },

  async update(id: number, data: Partial<CreateMeetingRequest>): Promise<Meeting> {
    const payload = {
      title: data.title,
      agenda: (data as any).agenda ?? (data as any).description ?? undefined,
      project_id: (data as any).project_id ?? undefined,
      scheduled_at: (data as any).scheduled_at ?? (data as any).date ?? (data as any).start_date ?? undefined,
      ended_at: (data as any).ended_at ?? (data as any).end_date ?? (data as any).end ?? undefined,
      location: (data as any).location ?? undefined,
      meeting_url: (data as any).meeting_url ?? (data as any).link ?? undefined,
      is_online: (data as any).is_online ?? false,
      participant_ids: (data as any).participant_ids ?? (data as any).participants ?? undefined,
    };
    try {
      const response = await apiClient.put(`/api/v1/meetings/${id}`, payload);
      const raw = response.data.meeting ?? response.data.data;
      return normalizeMeeting(raw);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Meeting update failed:', err?.response?.data?.errors ?? err?.response?.data);
      throw err;
    }
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/meetings/${id}`);
  },

  async invite(id: number, userIds: number[]): Promise<void> {
    await apiClient.post(`/api/v1/meetings/${id}/invite`, { user_ids: userIds });
  },

  async accept(id: number): Promise<void> {
    await apiClient.post(`/api/v1/meetings/${id}/accept`);
  },

  async decline(id: number): Promise<void> {
    await apiClient.post(`/api/v1/meetings/${id}/decline`);
  },

  async getCalendar(month?: number, year?: number): Promise<Meeting[]> {
    const response = await apiClient.get('/api/v1/meetings/calendar', {
      params: { month, year },
    });
    // eslint-disable-next-line no-console
    console.log('meetings.getCalendar response:', { status: response.status, data: response.data });
    // expose raw response for debugging in browser console
    try {
      (window as any).__lastCalendarResponse = response.data;
    } catch (e) {
      // ignore in non-browser environments
    }
    const rawItems = response.data?.calendar?.meetings ?? response.data?.meetings ?? response.data?.calendar ?? response.data?.data ?? [];
    const items = Array.isArray(rawItems) ? rawItems : [];
    const normalized = items.map((m: any) => normalizeMeeting(m));
    const unique = normalized.filter((meeting, index, self) => self.findIndex((other) => other.id === meeting.id) === index);
    return unique;
  },
};
