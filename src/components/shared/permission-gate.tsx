'use client';

import { usePermissions } from '@/lib/hooks/use-permissions';

interface PermissionGateProps {
  /** Permission(s) requise(s). Si plusieurs, au moins une suffit (mode "any"). */
  permission?: string | string[];
  /** Si true, toutes les permissions listees sont requises (mode "all"). */
  requireAll?: boolean;
  /** Contenu affiche si la permission est accordee. */
  children: React.ReactNode;
  /** Contenu affiche si la permission est refusee (optionnel). */
  fallback?: React.ReactNode;
}

/**
 * Affiche children uniquement si l'utilisateur a la permission requise.
 *
 * Exemples :
 *   <PermissionGate permission="users.create">
 *     <Button>Creer</Button>
 *   </PermissionGate>
 *
 *   <PermissionGate permission={["tasks.edit_any","tasks.edit_own"]}>
 *     <Button>Modifier</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can, hasAny, hasAll } = usePermissions();

  if (!permission) return <>{children}</>;

  const permissions = Array.isArray(permission) ? permission : [permission];

  const granted = requireAll ? hasAll(permissions) : hasAny(permissions);

  return granted ? <>{children}</> : <>{fallback}</>;
}
