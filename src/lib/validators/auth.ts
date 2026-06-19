import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Le nom d\'utilisateur doit contenir au moins 2 caractères'),
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  password_confirmation: z.string().min(8, 'La confirmation du mot de passe est requise'),
  institution: z.string().optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
  password: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  password_confirmation: z.string().min(8, 'La confirmation est requise'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  institution: z.string().optional(),
  specialty: z.string().max(200, 'La spécialité ne doit pas dépasser 200 caractères').optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
