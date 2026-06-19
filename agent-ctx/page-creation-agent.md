# Task: Create All 20 CollabSearch Frontend Pages

## Summary
Created all 20 page files for the CollabSearch frontend application at `/home/z/my-project/download/collabsearch-frontend/src/app/`. All pages are in French, use proper Next.js 16 App Router patterns, and integrate with existing components, hooks, stores, and API modules.

## Pages Created

### 1. Root Page (`/`)
- Checks authentication status via `useAuthStore`
- Redirects to `/dashboard` if authenticated, `/auth/login` if not
- Shows loading spinner during check

### 2. Auth Pages (no AppLayout)
- **Login** (`/auth/login`): Email/password form with `useLogin` hook, Suspense-wrapped for `useSearchParams`, CollabSearch branding
- **Register** (`/auth/register`): Full registration form with name, first_name, last_name, email, password, password_confirmation, institution
- **Forgot Password** (`/auth/forgot-password`): Email input, success state with confirmation message

### 3. Dashboard (`/dashboard`)
- Welcome message with user name
- Stats cards (projects, tasks, publications, meetings) using `usersApi.getDashboardStats`
- Recent projects list with status badges
- Upcoming meetings with time/location info
- Budget overview cards
- Quick action buttons

### 4. Project Pages
- **List** (`/projects`): Search + status filter, ProjectCard grid, create dialog with ProjectForm
- **New** (`/projects/new`): Full-page creation form with ProjectForm
- **Detail** (`/projects/[id]`): Tabbed view (overview/tasks/budget/publications/members), workflow actions (submit/approve/reject/archive), uses Next.js 16 `params: Promise<>` pattern
- **Edit** (`/projects/[id]/edit`): Pre-filled ProjectForm in edit mode
- **Tasks** (`/projects/[id]/tasks`): Full-page KanbanBoard with task creation dialog

### 5. Publication Pages
- **List** (`/publications`): Two tabs (list + advanced search), type filter, PublicationCard grid
- **New** (`/publications/new`): PublicationForm with PDF upload
- **Detail** (`/publications/[id]`): Full abstract, metadata, BibTeX/APA export, PDF download

### 6. Calendar (`/calendar`)
- CalendarView component integration

### 7. Messages (`/messages`)
- Two-column layout: ConversationList + ConversationPanel
- URL param support: `/messages?user=123`
- Suspense-wrapped for useSearchParams

### 8. Notifications (`/notifications`)
- NotificationList component integration

### 9. Profile (`/profile`)
- Profile info form (name, email, institution, bio)
- Change password section
- Uses `useUpdateProfile` and `useChangePassword`

### 10. Admin Pages
- **Users** (`/admin/users`): UserManagementTable component
- **Edit User** (`/admin/users/[id]/edit`): Edit form with role selection, uses Next.js 16 `params: Promise<>`
- **Stats** (`/admin/stats`): Charts (BarChart, PieChart), stat cards, budget overview, ReportGenerator

## Additional Files
- Created `loading.tsx` files for: auth/login, auth/register, dashboard, projects, publications, calendar, messages, notifications, profile, admin

## Technical Notes
- All text in French
- Dynamic routes use Next.js 16 pattern: `params: Promise<{ id: string }>` with `use()`
- `useSearchParams` wrapped in `Suspense` boundary (login, messages pages)
- Auth pages do NOT use AppLayout; all other pages do
- Loading states use `LoadingSpinner`, empty states use `EmptyState`
- Error handling via `toast` from sonner
- All imports reference existing components, hooks, stores, and API modules
