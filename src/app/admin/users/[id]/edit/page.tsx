'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/lib/api/admin-users';
import { USER_ROLES } from '@/lib/utils/constants';
import { getInitials, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types/models';

const editUserSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom de famille doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  institution: z.string().optional(),
  role: z.enum(['administrator', 'team_lead', 'researcher', 'institution']),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminUsersApi.get(userId),
    enabled: !!userId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: user
      ? {
          name: user.full_name,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          institution: user.institution ?? '',
          role: user.roles?.[0] ?? 'researcher',
        }
      : undefined,
    values: user
      ? {
          name: user.full_name,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          institution: user.institution ?? '',
          role: user.roles?.[0] ?? 'researcher',
        }
      : undefined,
  });

  const onSubmit = async (data: EditUserFormData) => {
    setIsSubmitting(true);
    try {
      await adminUsersApi.update(userId, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        institution: data.institution || null,
        roles: [data.role] as unknown as Partial<User>['roles'],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('Utilisateur mis à jour avec succès');
      router.push('/admin/users');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Utilisateur introuvable</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users')}>
            Retour
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentRole = watch('role');
  const roleInfo = currentRole ? USER_ROLES[currentRole] : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
              <AvatarFallback className="bg-[#2563EB] text-white">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Modifier l&apos;utilisateur</h1>
              <p className="text-muted-foreground text-sm">
                {user.email} · Inscrit le {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Informations de l&apos;utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    aria-invalid={!!errors.first_name}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    aria-invalid={!!errors.last_name}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom d&apos;utilisateur</Label>
                <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  placeholder="Université, laboratoire..."
                  {...register('institution')}
                />
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(USER_ROLES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roleInfo && (
                  <Badge className={cn('text-xs mt-1', roleInfo.bgColor)}>
                    {roleInfo.label}
                  </Badge>
                )}
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
