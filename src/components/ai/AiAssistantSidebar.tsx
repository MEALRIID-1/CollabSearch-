'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Bot, X, Send, Sparkles, Plus, ArrowRight, Brain, Globe, GlobeOff, Bell } from 'lucide-react';
import { useAiChat } from '@/lib/hooks/use-ai-chat';
import { AiChatMessage } from './AiChatMessage';
import { AiThinkingIndicator } from './AiThinkingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

export function AiAssistantSidebar() {
  const params = useParams();
  const projectId = params?.id ? Number(params.id) : undefined;
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  
  const {
    messages,
    isLoading,
    sendMessage,
    startNewChat,
    thinkingStage,
    webSearchEnabled,
    setWebSearchEnabled,
    memoryNotifications,
  } = useAiChat({ projectId, autoLoadConversations: false });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    const text = inputMessage;
    setInputMessage('');
    await sendMessage(text);
  };

  const handleSuggestion = (suggestion: string) => {
    setInputMessage('');
    sendMessage(suggestion);
  };

  const suggestions = projectId 
    ? [
        "Quelles sont les tâches en cours sur ce projet ?",
        "Fais-moi un résumé du projet.",
        "Qui travaille sur ce projet ?"
      ]
    : [
        "Quelles sont mes réunions aujourd'hui ?",
        "Quelles sont mes tâches urgentes ?",
        "Comment puis-je analyser mes publications ?"
      ];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-2xl hover:scale-105 transition-all duration-300 relative border border-white/20",
            isOpen
              ? "rotate-90 bg-gray-800 hover:bg-gray-700 text-white"
              : "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
          )}
          title="Assistant IA CollabSearch"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <Brain className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
            </>
          )}
        </button>
      </div>

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed top-16 right-0 bottom-0 z-40 w-full sm:w-[450px] bg-white border-l shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Assistant IA</h2>
              <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Pipeline 10 étapes {projectId ? '· Projet actif' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                webSearchEnabled ? "text-emerald-500 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-50"
              )}
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              title={webSearchEnabled ? "Web ON" : "Web OFF"}
            >
              {webSearchEnabled ? <Globe className="h-4 w-4" /> : <GlobeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => startNewChat()}
              title="Nouvelle discussion"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Memory Notifications */}
        {memoryNotifications.length > 0 && (
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-violet-50 border-b flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <Bell className="h-3 w-3 text-indigo-500 shrink-0" />
            {memoryNotifications.map((n, idx) => (
              <span key={idx} className="text-[10px] text-indigo-700 font-medium">{n}</span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-1 scrollbar-thin bg-gradient-to-b from-slate-50/30 to-white min-h-0">
          {messages.map((msg) => (
            <AiChatMessage
              key={msg.id}
              sender={msg.sender}
              text={msg.text}
              reasoning={msg.reasoning}
              confidence_score={msg.confidence_score}
              sources={msg.sources}
              advisor_insights={msg.advisor_insights}
              is_clarification={msg.is_clarification}
              timestamp={msg.timestamp}
            />
          ))}
          {isLoading && (
            <AiThinkingIndicator stage={thinkingStage} webSearchEnabled={webSearchEnabled} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length === 0 && (
          <div className="px-5 py-2 bg-gray-50 border-t space-y-2 shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Suggestions</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestion(s)}
                  className="text-left text-xs bg-white hover:bg-indigo-50/50 border hover:border-indigo-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{s}</span>
                  <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2 shrink-0">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Posez-moi une question…"
            disabled={isLoading}
            className="flex-1 focus-visible:ring-indigo-400"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
