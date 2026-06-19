import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface EncryptionKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encryptionKey: string;
  encryptionIv: string;
  fileName: string;
}

export function EncryptionKeyModal({
  open,
  onOpenChange,
  encryptionKey,
  encryptionIv,
  fileName,
}: EncryptionKeyModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIv, setCopiedIv] = useState(false);

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(encryptionKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyIv = async () => {
    await navigator.clipboard.writeText(encryptionIv);
    setCopiedIv(true);
    setTimeout(() => setCopiedIv(false), 2000);
  };

  const handleCopyBoth = async () => {
    const fullText = `Clé: ${encryptionKey}\nIV: ${encryptionIv}`;
    await navigator.clipboard.writeText(fullText);
    setCopiedKey(true);
    setCopiedIv(true);
    setTimeout(() => {
      setCopiedKey(false);
      setCopiedIv(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>🔐 Clé de déchiffrement</DialogTitle>
          <DialogDescription>
            Partage ces informations avec le destinataire pour qu'il puisse déchiffrer le fichier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nom du fichier */}
          <div>
            <label className="text-sm font-medium">Fichier</label>
            <div className="mt-1 p-2 bg-muted rounded text-sm">{fileName}</div>
          </div>

          {/* Clé */}
          <div>
            <label className="text-sm font-medium">Clé de déchiffrement</label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={encryptionKey}
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyKey}
                className="shrink-0"
              >
                {copiedKey ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* IV */}
          <div>
            <label className="text-sm font-medium">Vecteur d'initialisation (IV)</label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={encryptionIv}
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyIv}
                className="shrink-0"
              >
                {copiedIv ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Avertissement */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
            ⚠️ <strong>Important :</strong> Conserve ces clés dans un endroit sûr. Sans elles, le fichier ne peut pas être déchiffré.
          </div>

          {/* Boutons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button onClick={handleCopyBoth} className="bg-blue-600">
              Copier tout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
