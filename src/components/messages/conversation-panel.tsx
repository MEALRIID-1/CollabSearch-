'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Paperclip, X, Music, Play, Download, Link2, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { getInitials, formatRelative, formatDateTime } from '@/lib/utils/format';
import { useConversation, useSendMessage } from '@/lib/hooks/use-messages';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import mediaApi from '@/lib/api/media';
import { EncryptionKeyModal } from '@/components/messages/encryption-key-modal';
import { DecryptFileModal } from '@/components/messages/decrypt-file-modal';
import type { MessageAttachment as Attachment } from '@/types/models';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages';

interface ConversationPanelProps {
  userId?: number;
  conversationId?: number;
  conversationName?: string;
}

interface PendingAttachment extends Attachment {
  isUploading?: boolean;
}

export function ConversationPanel({ userId, conversationId, conversationName }: ConversationPanelProps) {
  const { data: conversationData, isLoading: isUserConversationLoading } = useConversation(userId ?? 0 as number);
  const { data: groupConversationData, isLoading: isGroupLoading } = useQuery({
    queryKey: conversationId ? ['conversation', 'group', conversationId] : ['conversation', 'group', 'none'],
    queryFn: () => conversationId ? messagesApi.getConversationMessages(conversationId) : Promise.resolve(null),
    enabled: !!conversationId,
  });
  const isLoading = conversationId ? isGroupLoading : isUserConversationLoading;
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const sendToConversationMutation = useMutation({
    mutationFn: ({ conversationId, data }: any) => messagesApi.sendToConversation(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', 'group'] });
      if (conversationId) queryClient.invalidateQueries({ queryKey: ['conversation', 'group', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
  const { user: currentUser } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [encryptFileUpload, setEncryptFileUpload] = useState(false);
  const [encryptionKeyModalOpen, setEncryptionKeyModalOpen] = useState(false);
  const [encryptionKeyData, setEncryptionKeyData] = useState<{
    key: string;
    iv: string;
    fileName: string;
  } | null>(null);
  const [decryptFileModalOpen, setDecryptFileModalOpen] = useState(false);
  const [decryptFileData, setDecryptFileData] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'message' | 'attachment' | null;
    id?: number;
    attachment?: Attachment | null;
  }>({ visible: false, x: 0, y: 0, type: null });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const messages = useMemo(() => {
    if (conversationId) {
      return Array.isArray(groupConversationData?.data) ? groupConversationData.data : (groupConversationData ?? []);
    }
    return conversationData?.data ?? [];
  }, [conversationData?.data, groupConversationData, conversationId]);

  const getUserDisplayName = (user: any) => {
    if (!user) return '';
    return user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Utilisateur';
  };

  const otherUser = !conversationId ? conversationData?.conversation_with ?? (
    messages.length > 0
      ? messages[0].sender_id === currentUser?.id
        ? messages[0].recipient
        : messages[0].sender
      : null
  ) : null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close context menu on left click outside; ignore right-clicks
  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      if (!contextMenu.visible) return;
      // ignore right-clicks so opening via right-click still works
      if ((e as any).button === 2) return;
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setContextMenu((s) => ({ ...s, visible: false }));
    };

    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, [contextMenu.visible]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((i) => (i + 1) % lightboxImages.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, lightboxImages.length]);

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setIsUploadingMedia(true);

    try {
      for (const file of files) {
        const mediaType = mediaApi.getMediaType(file.type);
        
        const placeholder: PendingAttachment = {
          id: -Math.random(),
          filename: file.name,
          original_name: file.name,
          mime_type: file.type,
          media_type: mediaType,
          size: file.size,
          url: URL.createObjectURL(file),
          created_at: new Date().toISOString(),
          isUploading: true,
          is_encrypted: encryptFileUpload,
        };
        setPendingAttachments(prev => [...prev, placeholder]);

        const uploadResult = await mediaApi.upload(file, mediaType, encryptFileUpload);
        const uploaded = uploadResult.data;

        setPendingAttachments(prev => 
          prev.map(att => att.id === placeholder.id ? uploaded : att)
        );

        // Si chiffrement côté client, afficher la modal avec la clé
        if (encryptFileUpload && uploadResult.encryptionKey && uploadResult.encryptionIv) {
          setEncryptionKeyData({
            key: uploadResult.encryptionKey,
            iv: uploadResult.encryptionIv,
            fileName: file.name,
          });
          setEncryptionKeyModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setPendingAttachments(prev => prev.filter(att => !att.isUploading));
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    return Array.from(new Set((text.match(urlRegex) || []).map((match) => {
      return match.startsWith('www.') ? `http://${match}` : match;
    })));
  };

  const handleRemoveAttachment = (attachmentId: number) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleDecryptFileSuccess = (decryptedData: ArrayBuffer, fileName: string) => {
    // Créer un blob et télécharger
    const blob = new Blob([decryptedData]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!messageText.trim() && pendingAttachments.length === 0) return;

    const urls = extractUrls(messageText.trim());
    const existingAttachmentIds = pendingAttachments.filter((att) => att.id > 0).map((att) => att.id);
    const uploadedAttachmentIds: number[] = [];
    setIsUploadingMedia(true);

    try {
      for (const url of urls) {
        if (pendingAttachments.some((att) => att.link_url === url || att.url === url)) {
          continue;
        }

        const placeholder: PendingAttachment = {
          id: -Math.random(),
          filename: url,
          original_name: url,
          mime_type: 'text/plain',
          media_type: 'link',
          size: 0,
          url,
          link_url: url,
          created_at: new Date().toISOString(),
          isUploading: true,
        };
        setPendingAttachments((prev) => [...prev, placeholder]);

        const uploaded = await mediaApi.uploadLink(url);
        uploadedAttachmentIds.push(uploaded.id);
        setPendingAttachments((prev) =>
          prev.map((att) => (att.id === placeholder.id ? uploaded : att))
        );
      }

      if (conversationId) {
        await sendToConversationMutation.mutateAsync({ conversationId, data: {
          content: messageText.trim() || undefined,
          attachment_ids: [...existingAttachmentIds, ...uploadedAttachmentIds],
        } });
      } else {
        await sendMessage.mutateAsync({
          recipient_id: userId ?? 0,
          content: messageText.trim() || undefined,
          attachment_ids: [...existingAttachmentIds, ...uploadedAttachmentIds],
        });
      }
      setMessageText('');
      setPendingAttachments([]);
    } catch {
      // Error handled by mutation
    } finally {
      setIsUploadingMedia(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner text="Chargement de la conversation..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      {(conversationId || otherUser) && (
        <div className="flex items-center gap-3 p-4 border-b">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={conversationId ? undefined : otherUser?.avatar ?? undefined}
              alt={conversationId ? conversationName ?? 'Groupe' : getUserDisplayName(otherUser)}
            />
            <AvatarFallback className="bg-[#2563EB] text-white text-sm">
              {conversationId
                ? (conversationName ? getInitials(conversationName) : 'GR')
                : getInitials(getUserDisplayName(otherUser))}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {conversationId ? (conversationName ?? 'Conversation de groupe') : getUserDisplayName(otherUser)}
            </p>
            <p className="text-xs text-muted-foreground">
              {conversationId ? 'Groupe' : otherUser?.email}
            </p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              Commencez la conversation
            </p>
          </div>
        ) : (
          [...messages].reverse().map((message) => {
            const isSent = message.sender_id === currentUser?.id;

            return (
                <div
                  key={message.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      type: 'message',
                      id: message.id,
                      attachment: message.attachments && message.attachments.length > 0 ? message.attachments[0] : null,
                    });
                  }}
                  className={cn(
                    'flex gap-2 items-end w-full',
                    isSent ? 'justify-end' : 'justify-start'
                  )}
                >
                {!isSent && (
                  <Avatar className="h-7 w-7 shrink-0 mt-auto mr-2">
                    <AvatarImage src={message.sender.avatar ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-[#2563EB] text-white">
                      {getInitials(message.sender.full_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2',
                    isSent
                      ? 'bg-[#2563EB] text-white rounded-br-md text-right'
                      : 'bg-muted rounded-bl-md text-left'
                  )}
                >
                  {conversationId && !isSent && (
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">
                      {getUserDisplayName(message.sender)}
                    </p>
                  )}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {message.attachments.map((attachment: Attachment) => (
                        <div
                          key={attachment.id}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'attachment', id: attachment.id, attachment });
                          }}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded bg-opacity-20',
                            isSent ? 'bg-white text-white' : 'bg-black text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2">
                        {attachment.is_encrypted && (
                          <Lock className="h-4 w-4 text-amber-400" />
                        )}
                        {attachment.media_type === 'image' && (
                          <Image
                            src={attachment.url}
                            alt={attachment.original_name}
                            width={64}
                            height={64}
                            className="h-16 w-16 object-cover rounded"
                            unoptimized
                          />
                        )}
                      </div>
                          {attachment.media_type === 'voice' && (
                            <div className="flex items-center gap-2">
                              {attachment.is_encrypted && (
                                <Lock className="h-4 w-4 text-amber-400" />
                              )}
                              <Music className="h-4 w-4" />
                              <span className="text-xs truncate">{attachment.original_name}</span>
                            </div>
                          )}
                          {attachment.media_type === 'video' && (
                            <div className="flex items-center gap-2">
                              {attachment.is_encrypted && (
                                <Lock className="h-4 w-4 text-amber-400" />
                              )}
                              <Play className="h-4 w-4" />
                              <span className="text-xs truncate">{attachment.original_name}</span>
                            </div>
                          )}
                          {attachment.media_type === 'file' && (
                            <div className="flex items-center gap-2">
                              {attachment.is_encrypted && (
                                <Lock className="h-4 w-4 text-amber-400" />
                              )}
                              <Paperclip className="h-4 w-4" />
                              <span className="text-xs truncate">{attachment.original_name}</span>
                            </div>
                          )}
                          {attachment.media_type === 'link' && (
                            <div className="flex items-center gap-2">
                              {attachment.is_encrypted && (
                                <Lock className="h-4 w-4 text-amber-400" />
                              )}
                              <Link2 className="h-4 w-4" />
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline hover:text-current"
                              >
                                {attachment.original_name}
                              </a>
                            </div>
                          )}
                          <div className="ml-auto flex items-center gap-1">
                            {attachment.is_encrypted ? (
                              <button
                                onClick={() => {
                                  setDecryptFileData({
                                    url: attachment.url,
                                    fileName: attachment.original_name,
                                  });
                                  setDecryptFileModalOpen(true);
                                }}
                                className="text-xs opacity-70 hover:opacity-100"
                                title="Déchiffrer et télécharger"
                              >
                                <Lock className="h-3 w-3" />
                              </button>
                            ) : (
                              <a 
                                href={attachment.url}
                                download={attachment.media_type !== 'link' ? attachment.original_name : undefined}
                                className="text-xs opacity-70 hover:opacity-100"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Context menu */}
                  {contextMenu.visible && (
                    <div
                      ref={menuRef}
                      style={{ left: contextMenu.x, top: contextMenu.y }}
                      className="fixed z-50 bg-white border rounded shadow-md text-sm"
                    >
                      <ul className="p-2">
                        {contextMenu.type === 'message' && (
                          <>
                            {contextMenu.attachment && (
                              <li
                                className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-black"
                                onClick={() => {
                                  if (!contextMenu.attachment) return;
                                  const att = contextMenu.attachment;
                                  if (att.media_type === 'image') {
                                    const imgs = messages.flatMap((m: any) => (m.attachments || []).filter((a: any) => a.media_type === 'image').map((a: any) => a.url));
                                    const idx = imgs.indexOf(att.url);
                                    setLightboxImages(imgs.length ? imgs : [att.url]);
                                    setLightboxIndex(idx >= 0 ? idx : 0);
                                    setLightboxOpen(true);
                                  } else {
                                    window.open(att.url, '_blank');
                                  }
                                  setContextMenu((s) => ({ ...s, visible: false }));
                                }}
                              >Ouvrir</li>
                            )}
                            <li
                              className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-black"
                              onClick={async () => {
                                if (!contextMenu.id) return;
                                await messagesApi.delete(contextMenu.id);
                                setContextMenu((s) => ({ ...s, visible: false }));
                                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                                queryClient.invalidateQueries({ queryKey: ['conversation', userId] });
                              }}
                            >Supprimer</li>
                          </>
                        )}
                        {contextMenu.type === 'attachment' && (
                          <>
                            <li
                              className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-black"
                              onClick={() => {
                                if (!contextMenu.attachment) return;
                                const att = contextMenu.attachment;
                                if (att.media_type === 'image') {
                                  // build images list from conversation messages
                                  const imgs = messages.flatMap((m: any) => (m.attachments || []).filter((a: any) => a.media_type === 'image').map((a: any) => a.url));
                                  const idx = imgs.indexOf(att.url);
                                  setLightboxImages(imgs.length ? imgs : [att.url]);
                                  setLightboxIndex(idx >= 0 ? idx : 0);
                                  setLightboxOpen(true);
                                } else {
                                  window.open(att.url, '_blank');
                                }
                                setContextMenu((s) => ({ ...s, visible: false }));
                              }}
                            >Ouvrir</li>
                            <li
                              className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-black"
                              onClick={async () => {
                                if (!contextMenu.id) return;
                                await mediaApi.delete(contextMenu.id);
                                setContextMenu((s) => ({ ...s, visible: false }));
                                queryClient.invalidateQueries({ queryKey: ['conversation', userId] });
                                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                              }}
                            >Supprimer</li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <p
                    className={cn(
                      'text-[10px] mt-2',
                      isSent ? 'text-blue-200' : 'text-muted-foreground'
                    )}
                  >
                    {message.read_at ? formatDateTime(message.read_at) : formatRelative(message.created_at)}
                  </p>
                </div>
                {isSent && (
                  <Avatar className="h-7 w-7 shrink-0 mt-auto ml-2">
                    <AvatarImage src={message.sender.avatar ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-[#10B981] text-white">
                      {getInitials(message.sender.full_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4 space-y-3">
        {/* Pending attachments preview */}
        {pendingAttachments.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {pendingAttachments.map((attachment) => (
              <div key={attachment.id} className="relative group">
                {attachment.media_type === 'image' ? (
                  <Image
                    src={attachment.url}
                    alt={attachment.original_name}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-cover rounded border"
                    unoptimized
                  />
                ) : (
                  <div className="h-16 w-16 rounded border flex items-center justify-center bg-muted text-xs text-center p-1">
                    <span className="line-clamp-2">{attachment.original_name}</span>
                  </div>
                )}
                {attachment.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
                <button
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleMediaSelect}
            disabled={isUploadingMedia}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />

              <Button
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingMedia || sendMessage.isPending}
            title="Ajouter un fichier, image, vidéo ou audio"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={encryptFileUpload ? 'secondary' : 'outline'}
            onClick={() => setEncryptFileUpload((prev) => !prev)}
            title="Chiffrer le fichier à l'envoi"
            disabled={isUploadingMedia || sendMessage.isPending}
          >
            <Lock className="h-4 w-4" />
          </Button>

          {encryptFileUpload && (
            <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
              <Lock className="mr-1 h-3.5 w-3.5" />
              Fichiers chiffrés
            </span>
          )}

          <Input
            placeholder="Écrire un message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isUploadingMedia || sendMessage.isPending}
            className="flex-1"
          />

          <Button
            type="button"
            onClick={handleSend}
            disabled={
              isUploadingMedia ||
              sendMessage.isPending ||
              (!messageText.trim() && pendingAttachments.length === 0)
            }
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {/* Lightbox dialog for images */}
      <Dialog open={lightboxOpen} onOpenChange={(open) => setLightboxOpen(open)}>
        <DialogContent className="max-w-5xl w-full bg-transparent shadow-none p-0">
          <div className="relative flex items-center justify-center bg-black/90 p-4 rounded">
            <button
              aria-label="Précédent"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
              onClick={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="max-h-[80vh] max-w-[90vw]">
              {lightboxImages[lightboxIndex] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lightboxImages[lightboxIndex]} alt={`Image ${lightboxIndex + 1}`} className="object-contain max-h-[80vh] max-w-[90vw] rounded" />
              )}
            </div>

            <button
              aria-label="Suivant"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
              onClick={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <DialogClose asChild>
              <button className="absolute right-4 top-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2">
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Encryption Key Modal */}
      {encryptionKeyData && (
        <EncryptionKeyModal
          open={encryptionKeyModalOpen}
          onOpenChange={setEncryptionKeyModalOpen}
          encryptionKey={encryptionKeyData.key}
          encryptionIv={encryptionKeyData.iv}
          fileName={encryptionKeyData.fileName}
        />
      )}

      {/* Decrypt File Modal */}
      {decryptFileData && (
        <DecryptFileModal
          open={decryptFileModalOpen}
          onOpenChange={setDecryptFileModalOpen}
          encryptedFileUrl={decryptFileData.url}
          fileName={decryptFileData.fileName}
          onSuccess={(data) => {
            handleDecryptFileSuccess(data, decryptFileData.fileName);
            setDecryptFileModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
