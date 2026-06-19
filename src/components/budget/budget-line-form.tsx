'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBudgetLine, useUpdateBudgetLine } from '@/lib/hooks/use-budget';
import { BUDGET_CATEGORIES } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import type { BudgetLine, BudgetCategory } from '@/types/models';

const budgetLineSchema = z.object({
  category: z.enum(['personnel', 'materiel', 'mission', 'publication', 'autre'], {
    message: 'Catégorie invalide',
  }),
  description: z.string().min(3, 'La description doit contenir au moins 3 caractères'),
  amount_planned: z.number().min(0, 'Le montant doit être positif'),
  amount_spent: z.number().min(0, 'Le montant dépensé doit être positif').optional(),
  date: z.string().min(1, 'La date est requise'),
  justification: z.string().optional(),
}).refine(
  (data) => !data.amount_spent || data.amount_spent <= data.amount_planned,
  {
    message: 'Le montant dépensé ne peut pas dépasser le montant alloué',
    path: ['amount_spent'],
  }
);

type BudgetLineFormData = z.infer<typeof budgetLineSchema>;

interface BudgetLineFormProps {
  projectId: number;
  budgetLine?: BudgetLine;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetLineForm({ projectId, budgetLine, onSuccess, onCancel }: BudgetLineFormProps) {
  const isEditing = !!budgetLine;
  const createLine = useCreateBudgetLine();
  const updateLine = useUpdateBudgetLine();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [justificationFile, setJustificatifFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetLineFormData>({
    resolver: zodResolver(budgetLineSchema),
    defaultValues: budgetLine
      ? {
          category: budgetLine.category,
          description: budgetLine.description,
          amount_planned: budgetLine.amount_planned,
          amount_spent: budgetLine.amount_spent,
          date: budgetLine.date,
          justification: budgetLine.justification ?? '',
        }
      : {
          category: 'personnel',
          amount_planned: 0,
          amount_spent: 0,
        },
  });

  const amountPlanned = watch('amount_planned');
  const amountSpent = watch('amount_spent') || 0;
  const isBudgetFull = amountSpent >= amountPlanned && amountPlanned > 0;

  const onSubmit = async (data: BudgetLineFormData) => {
    try {
      setServerError(null);
      if (isEditing && budgetLine) {
        await updateLine.mutateAsync({ id: budgetLine.id, data });
      } else {
        await createLine.mutateAsync({ projectId, data });
      }
      onSuccess?.();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Une erreur est survenue';
      setServerError(message);
    }
  };

  const isSubmitting = createLine.isPending || updateLine.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Server error */}
      {serverError && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erreur</p>
            <p className="text-sm text-red-700 mt-1">{serverError}</p>
          </div>
        </div>
      )}

      {/* Category */}
      <div className="space-y-2">
        <Label>Catégorie</Label>
        <Select
          value={watch('category')}
          onValueChange={(value) => setValue('category', value as BudgetCategory)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BUDGET_CATEGORIES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Description de la ligne budgétaire"
          rows={2}
          {...register('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount_planned">Montant alloué (XOF)</Label>
          <Input
            id="amount_planned"
            type="number"
            min={0}
            {...register('amount_planned', { valueAsNumber: true })}
            aria-invalid={!!errors.amount_planned}
          />
          {errors.amount_planned && (
            <p className="text-sm text-destructive">{errors.amount_planned.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount_spent">Montant dépensé (XOF)</Label>
          <Input
            id="amount_spent"
            type="number"
            min={0}
            {...register('amount_spent', { valueAsNumber: true })}
            aria-invalid={!!errors.amount_spent}
          />
          {errors.amount_spent && (
            <p className="text-sm text-destructive">{errors.amount_spent.message}</p>
          )}
        </div>
      </div>

      {/* Budget warning */}
      {isBudgetFull && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Budget entièrement consommé</p>
            <p className="text-sm text-red-700 mt-1">
              Le montant dépensé (XOF {amountSpent.toLocaleString()}) atteint ou dépasse le montant alloué (XOF {amountPlanned.toLocaleString()}).
            </p>
          </div>
        </div>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          {...register('date')}
          aria-invalid={!!errors.date}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Justificatif */}
      <div className="space-y-2">
        <Label>Justificatif</Label>
        <div
          className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-[#2563EB] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {justificationFile ? justificationFile.name : 'Cliquez pour sélectionner un justification'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setJustificatifFile(file);
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Mettre à jour' : 'Ajouter la ligne'}
        </Button>
      </div>
    </form>
  );
}
