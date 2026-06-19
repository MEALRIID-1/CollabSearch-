import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Maximum 100 caractères')
    .refine(
      (v) => v.toLowerCase() !== 'administrator',
      'Ce nom est réservé au système'
    ),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide (ex : #2563EB)'),
  description: z.string().max(500, 'Maximum 500 caractères').optional().nullable(),
  permissions: z.array(z.string()).optional().default([]),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Maximum 100 caractères')
    .refine(
      (v) => v.toLowerCase() !== 'administrator',
      'Ce nom est réservé au système'
    )
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide (ex : #2563EB)')
    .optional(),
  description: z.string().max(500, 'Maximum 500 caractères').optional().nullable(),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
