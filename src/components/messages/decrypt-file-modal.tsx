import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { decryptFile } from '@/lib/utils/encryption';

interface DecryptFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encryptedFileUrl: string;
  fileName: string;
  onSuccess: (decryptedData: ArrayBuffer) => void;
}

export function DecryptFileModal({
  open,
  onOpenChange,
  encryptedFileUrl,
  fileName,
  onSuccess,
}: DecryptFileModalProps) {
  const [encryptionKey, setEncryptionKey] = useState('');
  const [encryptionIv, setEncryptionIv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDecrypt = async () => {
    if (!encryptionKey.trim() || !encryptionIv.trim()) {
      setError('Veuillez entrer la clé et l\'IV.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Télécharger le fichier chiffré
      const response = await fetch(encryptedFileUrl);
      const encryptedText = await response.text();

      // Déchiffrer
      const decryptedData = decryptFile(
        encryptedText,
        encryptionKey.replace(/\s/g, ''),
        encryptionIv.replace(/\s/g, '')
      );

      onSuccess(decryptedData);
      onOpenChange(false);
      setEncryptionKey('');
      setEncryptionIv('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de déchiffrement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>🔓 Déchiffrer le fichier</DialogTitle>
          <DialogDescription>
            Entrez la clé et l'IV pour déchiffrer le fichier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nom du fichier */}
          <div>
            <label className="text-sm font-medium">Fichier</label>
            <div className="mt-1 p-2 bg-muted rounded text-sm truncate">{fileName}</div>
          </div>

          {/* Clé */}
          <div>
            <label className="text-sm font-medium">Clé de déchiffrement</label>
            <Input
              placeholder="Collez la clé ici..."
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="font-mono text-xs mt-1"
              disabled={isLoading}
            />
          </div>

          {/* IV */}
          <div>
            <label className="text-sm font-medium">Vecteur d'initialisation (IV)</label>
            <Input
              placeholder="Collez l'IV ici..."
              value={encryptionIv}
              onChange={(e) => setEncryptionIv(e.target.value)}
              className="font-mono text-xs mt-1"
              disabled={isLoading}
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-900">
              ❌ {error}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleDecrypt} disabled={isLoading || !encryptionKey.trim() || !encryptionIv.trim()} className="bg-blue-600">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Déchiffrement...
                </>
              ) : (
                'Déchiffrer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
