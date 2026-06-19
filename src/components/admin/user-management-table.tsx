'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search, Trash2, Shield, Edit, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { PermissionGate } from '@/components/shared/permission-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getInitials, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { adminUsersApi } from '@/lib/api/admin-users';
import { usersApi } from '@/lib/api/users';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/lib/api/roles';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { User } from '@/types/models';

export function UserManagementTable() {
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();

  // Rôles personnalisés — endpoint admin uniquement
  const { data: customRoles = [] } = useQuery({
    queryKey: ['custom-roles'],
    queryFn: async () => {
      const res = await rolesApi.getRoles();
      return res.data.data;
    },
    enabled: isAdmin,
    staleTime: 2 * 60 * 1000,
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('__all__');
  const [showTrashed, setShowTrashed] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    institution: '',
    specialty: '',
    custom_role_uuid: '',
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<{ institution: string; specialty: string; newPassword: string }>({ institution: '', specialty: '', newPassword: '' });
  const [selectedCustomRoleUuid, setSelectedCustomRoleUuid] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', isAdmin ? 'admin' : 'basic', showTrashed ? 'trashed' : 'active', search, roleFilter],
    queryFn: () => {
      if (!isAdmin) {
        // Non-admin : endpoint standard accessible à tous les authentifiés
        return usersApi.list({ search: search || undefined });
      }
      const custom_role_uuid = (roleFilter && roleFilter !== '__all__') ? roleFilter : undefined;
      return showTrashed
        ? adminUsersApi.trashed({ search: search || undefined })
        : adminUsersApi.list({ search: search || undefined, custom_role_uuid });
    },
  });

  const users = usersData?.data ?? [];

  const handleUpdateRole = async () => {
    if (!editUser) return;
    setIsUpdating(true);
    try {
      const uuid = selectedCustomRoleUuid === '__none__' ? null : (selectedCustomRoleUuid || null);
      await adminUsersApi.update(editUser.id, {
        custom_role_uuid: uuid,
        institution: editData.institution || undefined,
        specialty: editData.specialty || undefined,
        new_password: editData.newPassword || undefined,
      } as any);
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role mis a jour avec succes.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la mise a jour du role.';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateUser = async () => {
    setIsCreating(true);
    const providedPassword = newUserData.password;
    try {
      const result = await adminUsersApi.create({
        first_name: newUserData.first_name,
        last_name: newUserData.last_name,
        email: newUserData.email,
        password: providedPassword || undefined,
        institution: newUserData.institution || undefined,
        specialty: newUserData.specialty || undefined,
        custom_role_uuid: (newUserData.custom_role_uuid && newUserData.custom_role_uuid !== '__none__') ? newUserData.custom_role_uuid : undefined,
      } as any);
      setNewUserData({ first_name: '', last_name: '', email: '', password: '', institution: '', specialty: '', custom_role_uuid: '' });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (!providedPassword && result.password) {
        setGeneratedPassword(result.password);
      } else {
        toast.success('Utilisateur cree avec succes.');
      }
    } catch (err: any) {
      const errors = err?.response?.data?.errors as Record<string, string[]> | undefined;
      if (errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(errors).forEach(([field, msgs]) => {
          fieldErrors[field] = msgs[0];
        });
        setCreateErrors(fieldErrors);
        const firstError = Object.values(fieldErrors)[0];
        toast.error(firstError ?? 'Erreur de validation.');
      } else {
        toast.error(err?.response?.data?.message ?? 'Erreur lors de la creation.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminUsersApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Utilisateur supprime.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreUser = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      await adminUsersApi.restore(restoreTarget.id);
      setRestoreTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Utilisateur restaure.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la restauration.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner text="Chargement des utilisateurs..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {showTrashed ? 'Corbeille des utilisateurs' : 'Gestion des utilisateurs'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {showTrashed
                  ? 'Restaurez les comptes supprimes soft-delete'
                  : 'Gestion des comptes utilisateurs.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!showTrashed && (
                <PermissionGate permission="users.create">
                  <Button
                    variant="secondary"
                    className="h-9"
                    onClick={() => { setShowCreateDialog(true); setCreateErrors({}); }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </PermissionGate>
              )}
              {isAdmin && (
                <Button
                  variant={showTrashed ? 'secondary' : 'outline'}
                  className="h-9"
                  onClick={() => setShowTrashed((current) => !current)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {showTrashed ? 'Retour' : 'Voir corbeille'}
                </Button>
              )}
              <Button
                variant="outline"
                className="h-9"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
                aria-label="Rafraichir"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {users.length} utilisateur{users.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrer par role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous les roles</SelectItem>
                  {customRoles.map((role) => (
                    <SelectItem key={role.uuid} value={role.uuid}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>{showTrashed ? 'Supprime le' : 'Inscrit le'}</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouve
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const customRole = user.custom_role;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
                              <AvatarFallback className="text-xs bg-[#2563EB] text-white">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {customRole ? (
                            <Badge
                              className="text-xs text-white"
                              style={{ backgroundColor: customRole.color }}
                            >
                              {customRole.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucun role</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {showTrashed ? formatDate(user.deleted_at ?? '') : formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!showTrashed && (
                              <PermissionGate permission="users.edit">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditUser(user);
                                    setSelectedCustomRoleUuid(user.custom_role?.uuid ?? '__none__');
                                    setEditData({ institution: user.institution ?? '', specialty: user.specialty ?? '', newPassword: '' });
                                  }}
                                  aria-label="Modifier le role"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            )}
                            {showTrashed ? (
                              <PermissionGate permission="users.restore">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => setRestoreTarget(user)}
                                  aria-label="Restaurer utilisateur"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            ) : (
                              <PermissionGate permission="users.delete">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteTarget(user)}
                                  aria-label="Supprimer utilisateur"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit role dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {editUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              placeholder="Institution"
              value={editData.institution}
              onChange={(e) => setEditData({ ...editData, institution: e.target.value })}
            />
            <Input
              placeholder="Specialite"
              value={editData.specialty}
              onChange={(e) => setEditData({ ...editData, specialty: e.target.value })}
            />
            <Input
              placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
              type="password"
              value={editData.newPassword}
              onChange={(e) => setEditData({ ...editData, newPassword: e.target.value })}
            />
            <Select value={selectedCustomRoleUuid} onValueChange={setSelectedCustomRoleUuid}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- Aucun role --</SelectItem>
                {customRoles.map((role) => (
                  <SelectItem key={role.uuid} value={role.uuid}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: role.color }}
                      />
                      {role.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={isUpdating}
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            >
              {isUpdating ? 'Mise a jour...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create user dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && setShowCreateDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Prenom"
                  value={newUserData.first_name}
                  onChange={(e) => { setNewUserData({ ...newUserData, first_name: e.target.value }); setCreateErrors((p) => ({ ...p, first_name: '' })); }}
                />
                {createErrors.first_name && <p className="text-xs text-destructive mt-1">{createErrors.first_name}</p>}
              </div>
              <div>
                <Input
                  placeholder="Nom"
                  value={newUserData.last_name}
                  onChange={(e) => { setNewUserData({ ...newUserData, last_name: e.target.value }); setCreateErrors((p) => ({ ...p, last_name: '' })); }}
                />
                {createErrors.last_name && <p className="text-xs text-destructive mt-1">{createErrors.last_name}</p>}
              </div>
            </div>
            <div>
              <Input
                placeholder="Adresse e-mail"
                type="email"
                value={newUserData.email}
                onChange={(e) => { setNewUserData({ ...newUserData, email: e.target.value }); setCreateErrors((p) => ({ ...p, email: '' })); }}
                className={createErrors.email ? 'border-destructive' : ''}
              />
              {createErrors.email && <p className="text-xs text-destructive mt-1">{createErrors.email}</p>}
            </div>
            <div>
              <Input
                placeholder="Mot de passe (laisser vide = genere automatiquement)"
                type="password"
                value={newUserData.password}
                onChange={(e) => { setNewUserData({ ...newUserData, password: e.target.value }); setCreateErrors((p) => ({ ...p, password: '' })); }}
                className={createErrors.password ? 'border-destructive' : ''}
              />
              {createErrors.password && <p className="text-xs text-destructive mt-1">{createErrors.password}</p>}
            </div>
            <Input
              placeholder="Institution"
              value={newUserData.institution}
              onChange={(e) => setNewUserData({ ...newUserData, institution: e.target.value })}
            />
            <Input
              placeholder="Specialite"
              value={newUserData.specialty}
              onChange={(e) => setNewUserData({ ...newUserData, specialty: e.target.value })}
            />
            <Select
              value={newUserData.custom_role_uuid}
              onValueChange={(value) => setNewUserData({ ...newUserData, custom_role_uuid: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un role (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- Aucun role --</SelectItem>
                {customRoles.map((role) => (
                  <SelectItem key={role.uuid} value={role.uuid}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: role.color }}
                      />
                      {role.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreating || !newUserData.first_name || !newUserData.last_name || !newUserData.email}
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            >
              {isCreating ? 'Creation...' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated password dialog — shown when admin didn't specify a password */}
      <Dialog open={!!generatedPassword} onOpenChange={(open) => { if (!open) setGeneratedPassword(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compte cree avec succes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Aucun mot de passe n'a ete specifie. Voici le mot de passe temporaire genere.
              Transmettez-le a l'utilisateur, il ne sera plus affiche apres fermeture.
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={generatedPassword ?? ''}
                className="font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword ?? '');
                  toast.success('Mot de passe copie.');
                }}
              >
                Copier
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setGeneratedPassword(null)} className="bg-[#2563EB] hover:bg-[#2563EB]/90">
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer l'utilisateur"
        description={`Etes-vous sur de vouloir supprimer l'utilisateur "${deleteTarget?.full_name}" ?`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="Restaurer l'utilisateur"
        description={`Voulez-vous restaurer le compte de "${restoreTarget?.full_name}" ?`}
        confirmLabel="Restaurer"
        onConfirm={handleRestoreUser}
        isLoading={isRestoring}
      />
    </>
  );
}
