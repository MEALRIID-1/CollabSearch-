'use client';

import { Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { UserManagementTable } from '@/components/admin/user-management-table';

export default function AdminUsersPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des comptes utilisateurs
            </p>
          </div>
        </div>

        {/* User management table */}
        <UserManagementTable />
      </div>
    </AppLayout>
  );
}
