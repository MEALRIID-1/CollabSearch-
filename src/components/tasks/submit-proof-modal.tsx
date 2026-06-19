'use client';

import { useState, useRef } from 'react';
import { Loader2, Upload, FileText, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { tasksApi } from '@/lib/api/tasks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/utils/format';

interface SubmitProofModalProps {
  taskId: number;
  open: boolean;
  onClose: () => void;
}

export function SubmitProofModal({ taskId, open, onClose }: SubmitProofModalProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await tasksApi.uploadAttachment(taskId, formData);
      await tasksApi.updateStatus(taskId, 'submitted');
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Tâche soumise avec succès');
      handleClose();
    } catch {
      toast.error('Erreur lors de la soumission. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Soumettre la tâche</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Joignez une preuve de réalisation. Le responsable pourra la consulter avant de valider ou refuser la tâche.
          </p>

          <div className="space-y-2">
            <Label>
              Preuve de réalisation <span className="text-destructive">*</span>
            </Label>

            {selectedFile ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleRemoveFile}
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-muted-foreground hover:border-[#2563EB] hover:text-[#2563EB] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Cliquer pour sélectionner un fichier</span>
                <span className="text-xs mt-1 text-center">
                  PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, ZIP (max 10 Mo)
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-white">
              {isSubmitting ? 'Envoi…' : 'Soumettre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
