'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPublicationSchema,
  updatePublicationSchema,
  type CreatePublicationFormData,
  type UpdatePublicationFormData,
} from '@/lib/validators/publication';
import { useCreatePublication, useUpdatePublication } from '@/lib/hooks/use-publications';
import { PUBLICATION_TYPES } from '@/lib/utils/constants';
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
import { Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Publication, PublicationType } from '@/types/models';

interface PublicationFormProps {
  publication?: Publication;
  onSuccess?: (publication: Publication) => void;
  onCancel?: () => void;
}

type FormData = CreatePublicationFormData | UpdatePublicationFormData;

export function PublicationForm({ publication, onSuccess, onCancel }: PublicationFormProps) {
  const isEditing = !!publication;
  const createPublication = useCreatePublication();
  const updatePublication = useUpdatePublication();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const authorsString = Array.isArray(publication?.authors)
    ? (publication.authors as string[]).join(', ')
    : (publication?.authors ?? '');

  const keywordsDefault = Array.isArray(publication?.keywords)
    ? publication.keywords
    : [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isEditing ? updatePublicationSchema : createPublicationSchema) as any,
    defaultValues: isEditing
      ? {
          title: publication.title ?? '',
          authors: authorsString,
          type: publication.type as PublicationType,
          year: publication.year ?? new Date().getFullYear(),
          journal: publication.journal ?? '',
          conference: (publication as any).conference ?? (publication as any).conference_name ?? '',
          doi: publication.doi ?? '',
          abstract: publication.abstract ?? '',
          keywords: keywordsDefault,
        }
      : {
          type: 'article' as PublicationType,
          year: new Date().getFullYear(),
        },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.type) formData.append('type', data.type);
      if (data.year) formData.append('year', String(data.year));
      if (data.abstract) formData.append('abstract', data.abstract);
      if ((data as any).journal) formData.append('journal', (data as any).journal);
      if ((data as any).conference) formData.append('conference_name', (data as any).conference);
      if ((data as any).doi) formData.append('doi', (data as any).doi);
      if ((data as any).project_id) formData.append('project_id', String((data as any).project_id));

      const authorsVal = (data as any).authors ?? '';
      if (authorsVal) {
        const authors = authorsVal
          .split(',')
          .map((a: string) => a.trim())
          .filter(Boolean);
        authors.forEach((a: string) => formData.append('authors[]', a));
      }

      const keywords = (data as any).keywords;
      if (keywords && keywords.length > 0) {
        keywords.forEach((k: string) => formData.append('keywords[]', k));
      }

      if (selectedFile) formData.append('file', selectedFile);

      if (isEditing) {
        formData.append('_method', 'PUT');
        const updated = await updatePublication.mutateAsync({ id: publication.id, data: formData });
        toast.success('Publication modifiee avec succes');
        onSuccess?.(updated);
      } else {
        const created = await createPublication.mutateAsync(formData);
        toast.success('Publication creee avec succes');
        onSuccess?.(created);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Une erreur est survenue';
      toast.error(msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const isPending = isEditing ? updatePublication.isPending : createPublication.isPending;
  const typeValue = watch('type' as any) as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          placeholder="Titre de la publication"
          {...register('title' as any)}
          aria-invalid={!!(errors as any).title}
        />
        {(errors as any).title && (
          <p className="text-sm text-destructive">{(errors as any).title.message}</p>
        )}
      </div>

      {/* Authors */}
      <div className="space-y-2">
        <Label htmlFor="authors">Auteurs</Label>
        <Input
          id="authors"
          placeholder="Noms des auteurs separes par des virgules"
          {...register('authors' as any)}
          aria-invalid={!!(errors as any).authors}
        />
        {(errors as any).authors && (
          <p className="text-sm text-destructive">{(errors as any).authors.message}</p>
        )}
      </div>

      {/* Type & Year */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={typeValue ?? 'article'}
            onValueChange={(value) => setValue('type' as any, value as PublicationType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectionner" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PUBLICATION_TYPES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(errors as any).type && (
            <p className="text-sm text-destructive">{(errors as any).type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Annee</Label>
          <Input
            id="year"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            {...register('year' as any, { valueAsNumber: true })}
            aria-invalid={!!(errors as any).year}
          />
          {(errors as any).year && (
            <p className="text-sm text-destructive">{(errors as any).year.message}</p>
          )}
        </div>
      </div>

      {/* Journal & Conference */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="journal">Journal</Label>
          <Input id="journal" placeholder="Nom du journal" {...register('journal' as any)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conference">Conference</Label>
          <Input id="conference" placeholder="Nom de la conference" {...register('conference' as any)} />
        </div>
      </div>

      {/* DOI */}
      <div className="space-y-2">
        <Label htmlFor="doi">DOI</Label>
        <Input id="doi" placeholder="10.xxxx/xxxxx" {...register('doi' as any)} />
      </div>

      {/* Abstract */}
      <div className="space-y-2">
        <Label htmlFor="abstract">
          Resume {!isEditing && <span className="text-destructive">*</span>}
        </Label>
        <Textarea
          id="abstract"
          placeholder="Resume de la publication"
          rows={4}
          {...register('abstract' as any)}
          aria-invalid={!!(errors as any).abstract}
        />
        {(errors as any).abstract && (
          <p className="text-sm text-destructive">{(errors as any).abstract.message}</p>
        )}
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label htmlFor="keywords">Mots-cles (separes par des virgules)</Label>
        <Input
          id="keywords"
          placeholder="mot-cle1, mot-cle2, mot-cle3"
          defaultValue={keywordsDefault.join(', ')}
          {...register('keywords' as any, {
            setValueAs: (v: string | string[]) =>
              Array.isArray(v) ? v : (v ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          })}
        />
      </div>

      {/* PDF upload */}
      <div className="space-y-2">
        <Label>Fichier PDF</Label>
        <div
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-[#2563EB] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {selectedFile
              ? selectedFile.name
              : isEditing && (publication as any).pdf_path
              ? 'Cliquez pour remplacer le PDF existant'
              : 'Cliquez pour selectionner un fichier PDF'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
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
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Enregistrer les modifications' : 'Creer la publication'}
        </Button>
      </div>
    </form>
  );
}
