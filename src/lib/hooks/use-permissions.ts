import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * Hook central pour la gestion des permissions.
 *
 * Logique :
 *  - Les administrateurs ont acces a tout (bypass total).
 *  - Les autres utilisateurs sont controles par leurs permissions de role custom.
 *  - Si un utilisateur n'a pas de role custom, on lui accorde les permissions de base.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const isAdmin = user?.roles?.includes('administrator') ?? false;

  /**
   * Verifie si l'utilisateur possede une permission specifique.
   * Les admins passent toujours.
   */
  function can(permission: string): boolean {
    if (!user) return false;
    if (isAdmin) return true;
    const perms = user.permissions ?? [];
    return perms.includes(permission);
  }

  /**
   * Verifie si l'utilisateur possede au moins une des permissions listees.
   */
  function hasAny(permissions: string[]): boolean {
    if (!user) return false;
    if (isAdmin) return true;
    return permissions.some((p) => can(p));
  }

  /**
   * Verifie si l'utilisateur possede toutes les permissions listees.
   */
  function hasAll(permissions: string[]): boolean {
    if (!user) return false;
    if (isAdmin) return true;
    return permissions.every((p) => can(p));
  }

  /**
   * Retourne vrai si l'utilisateur n'a aucun role custom assigne.
   * Dans ce cas, on applique les acces par defaut (tout sauf les actions admin).
   */
  const hasNoCustomRole = !user?.custom_role && !isAdmin;

  return { can, hasAny, hasAll, isAdmin, hasNoCustomRole, user };
}
