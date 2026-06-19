<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Contrôleur pour les uploads de médias - CollabSearch
 */
class MediaController extends Controller
{
    /**
     * Upload un fichier média (image, vidéo, audio, document)
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'media_type' => 'required|in:image,file,voice,video,link',
                'file' => 'required_without:link_url|file|max:104857600', // 100MB max
                'link_url' => 'required_without:file|nullable|url|max:2048',
                'encrypted' => 'sometimes|boolean',
                'client_encrypted' => 'sometimes|boolean',
            ]);

            $mediaType = $request->get('media_type');
            $file = $request->file('file');
            $linkUrl = $request->get('link_url');
            $encrypted = (bool) $request->get('encrypted', false);
            $clientEncrypted = (bool) $request->get('client_encrypted', false);
            $path = null;
            $fileName = null;
            $mimeType = null;
            $size = 0;
            $isEncrypted = false;
            $signature = null;
            $iv = null;

            if ($mediaType !== 'link' && $file) {
                $storagePath = match ($mediaType) {
                    'image' => 'media/images',
                    'voice' => 'media/voice',
                    'video' => 'media/videos',
                    'file' => 'media/files',
                    default => 'media/files',
                };

                $fileName = Str::uuid() . '.enc';
                $rawContents = file_get_contents($file->getRealPath());
                $mimeType = $file->getMimeType();
                $size = $file->getSize();

                // Si chiffrement côté client, stocker le fichier tel quel (déjà chiffré)
                if ($clientEncrypted) {
                    $path = $storagePath . '/' . $fileName;
                    Storage::disk('public')->put($path, $rawContents);
                    $isEncrypted = true;
                    // Pas de signature/iv pour le chiffrement côté client (clé non disponible serveur)
                } elseif ($encrypted) {
                    // Chiffrement côté serveur (ancien flux)
                    [$encryptedContents, $iv, $signature] = $this->encryptPayload($rawContents);
                    $path = $storagePath . '/encrypted/' . $fileName;
                    Storage::disk('public')->put($path, $encryptedContents);
                    $isEncrypted = true;
                } else {
                    // Pas de chiffrement
                    $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs($storagePath, $fileName, 'public');
                }
            }

            $attachment = Attachment::create([
                'user_id' => $request->user()->id,
                'filename' => $fileName ?? ($linkUrl ? basename(parse_url($linkUrl, PHP_URL_PATH) ?? $linkUrl) : ''),
                'original_name' => $file ? $file->getClientOriginalName() : $linkUrl,
                'mime_type' => $mimeType ?? 'text/plain',
                'media_type' => $mediaType,
                'size' => $size,
                'path' => $path,
                'link_url' => $linkUrl,
                'is_encrypted' => $isEncrypted,
                'signature' => $signature,
                'iv' => $iv,
            ]);

            $url = $attachment->media_type === 'link'
                ? $attachment->link_url
                : ($attachment->is_encrypted
                    ? route('media.download', ['attachmentId' => $attachment->id])
                    : Storage::disk('public')->url($attachment->path));

            return response()->json([
                'data' => [
                    'id' => $attachment->id,
                    'filename' => $attachment->filename,
                    'original_name' => $attachment->original_name,
                    'mime_type' => $attachment->mime_type,
                    'media_type' => $attachment->media_type,
                    'size' => $attachment->size,
                    'link_url' => $attachment->link_url,
                    'is_encrypted' => $attachment->is_encrypted,
                    'url' => $url,
                    'created_at' => $attachment->created_at->toISOString(),
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation de l\'upload échouée.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'upload du fichier.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Télécharger un fichier média
     */
    public function download(int $attachmentId): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        try {
            $attachment = Attachment::findOrFail($attachmentId);
            
            // Vérifier les autorisations
            if ($attachment->message_id) {
                $message = $attachment->message;
                $currentUser = auth()->user();
                
                if ($message->sender_id !== $currentUser->id && $message->recipient_id !== $currentUser->id) {
                    abort(403, 'Accès non autorisé');
                }
            }

            if ($attachment->media_type === 'link' && $attachment->link_url) {
                return response()->redirectTo($attachment->link_url);
            }

            $path = Storage::disk('public')->path($attachment->path);

            if ($attachment->is_encrypted) {
                $encryptedContents = Storage::disk('public')->get($attachment->path);
                if (!$this->verifySignature($encryptedContents, $attachment->signature)) {
                    abort(500, 'Fichier corrompu ou signature invalide.');
                }

                $decrypted = $this->decryptPayload($encryptedContents, $attachment->iv);

                return response()->streamDownload(function () use ($decrypted) {
                    echo $decrypted;
                }, $attachment->original_name, [
                    'Content-Type' => $attachment->mime_type,
                ]);
            }

            return response()->download($path, $attachment->original_name);
        } catch (\Exception $e) {
            abort(404, 'Fichier non trouvé');
        }
    }

    /**
     * Supprimer un fichier média
     */
    public function delete(int $attachmentId): JsonResponse
    {
        try {
            $attachment = Attachment::findOrFail($attachmentId);
            
            // Vérifier que l'utilisateur est le propriétaire
            if ($attachment->user_id !== auth()->user()->id) {
                return response()->json([
                    'message' => 'Vous n\'êtes pas autorisé à supprimer ce fichier.',
                ], 403);
            }

            // Soft-delete the attachment record (do not remove file from storage)
            $attachment->delete();

            // You may choose to keep the file on disk for now; a cleanup job can remove orphaned files later.

            return response()->json([
                'message' => 'Fichier supprimé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du fichier.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function encryptPayload(string $payload): array
    {
        $key = $this->getEncryptionKey();
        $iv = random_bytes(openssl_cipher_iv_length('AES-256-CBC'));
        $encrypted = openssl_encrypt($payload, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);

        if ($encrypted === false) {
            throw new \RuntimeException('Encryption failed.');
        }

        $encodedEncrypted = base64_encode($encrypted);
        $signature = hash_hmac('sha256', $encodedEncrypted, $this->getSignatureKey());

        return [$encodedEncrypted, base64_encode($iv), $signature];
    }

    private function decryptPayload(string $encryptedPayload, ?string $encodedIv): string
    {
        $key = $this->getEncryptionKey();
        $iv = base64_decode($encodedIv);
        $encrypted = base64_decode($encryptedPayload);

        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv) ?: '';
    }

    private function verifySignature(string $encryptedPayload, ?string $signature): bool
    {
        if (empty($signature)) {
            return false;
        }

        return hash_equals($signature, hash_hmac('sha256', $encryptedPayload, $this->getSignatureKey()));
    }

    private function getEncryptionKey(): string
    {
        $secret = config('app.key') ?: env('ATTACHMENT_ENCRYPTION_SECRET');

        if (str_starts_with($secret, 'base64:')) {
            $secret = base64_decode(substr($secret, 7));
        }

        return hash('sha256', $secret, true);
    }

    private function getSignatureKey(): string
    {
        $secret = env('ATTACHMENT_SIGNATURE_SECRET', config('app.key'));

        if (str_starts_with($secret, 'base64:')) {
            $secret = base64_decode(substr($secret, 7));
        }

        return hash('sha256', $secret, true);
    }
}
