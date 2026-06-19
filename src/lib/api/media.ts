import apiClient from './client';
import { encryptFile, generateEncryptionKey } from '@/lib/utils/encryption';

export interface MediaUploadResponse {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  media_type: 'image' | 'file' | 'voice' | 'video' | 'link';
  size: number;
  url: string;
  link_url?: string;
  is_encrypted?: boolean;
  encryption_key?: string;
  encryption_iv?: string;
  created_at: string;
}

const mediaApi = {
  /**
   * Upload un fichier média
   * @param file Fichier à uploader
   * @param mediaType Type de média
   * @param encryptClientSide Si true, chiffre côté client et retourne la clé
   */
  async upload(
    file: File,
    mediaType: 'image' | 'file' | 'voice' | 'video',
    encryptClientSide = false
  ): Promise<{ data: MediaUploadResponse; encryptionKey?: string; encryptionIv?: string }> {
    let fileToUpload = file;
    let mimeType = file.type;
    let encryptionKey: string | undefined;
    let encryptionIv: string | undefined;

    // Chiffrement côté client
    if (encryptClientSide) {
      encryptionKey = generateEncryptionKey();
      const fileBuffer = await file.arrayBuffer();
      const { encrypted, iv } = encryptFile(fileBuffer, encryptionKey);
      encryptionIv = iv;

      // Convertir le texte chiffré en blob
      const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
      fileToUpload = new File([encryptedBlob], file.name + '.enc', { type: 'text/plain' });
      mimeType = 'text/plain';
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('media_type', mediaType);
    formData.append('original_mime_type', file.type);
    if (encryptClientSide) {
      formData.append('client_encrypted', '1');
    }

    const response = await apiClient.post<{ data: MediaUploadResponse }>('/api/v1/media/upload', formData);

    return {
      data: response.data.data,
      encryptionKey,
      encryptionIv,
    };
  },

  async uploadLink(linkUrl: string): Promise<MediaUploadResponse> {
    const response = await apiClient.post<{ data: MediaUploadResponse }>('/api/v1/media/upload', {
      media_type: 'link',
      link_url: linkUrl,
    });

    return response.data.data;
  },

  /**
   * Supprimer un fichier média
   */
  async delete(attachmentId: number): Promise<void> {
    await apiClient.delete(`/api/v1/media/${attachmentId}`);
  },

  /**
   * Déterminer le type de média basé sur le MIME type
   */
  getMediaType(mimeType: string): 'image' | 'file' | 'voice' | 'video' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'voice';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  },

  /**
   * Obtenir l'icône basée sur le type de média
   */
  getMediaIcon(mediaType: string, mimeType?: string): string {
    switch (mediaType) {
      case 'image':
        return '🖼️';
      case 'voice':
        return '🎙️';
      case 'video':
        return '🎥';
      case 'file':
      default:
        if (mimeType?.includes('pdf')) return '📄';
        if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
        if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '📊';
        return '📎';
    }
  },
};

export default mediaApi;
