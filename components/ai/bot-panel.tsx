'use client';

import { useState, useRef, useEffect } from 'react';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useNotesStore } from '@/stores/notes.store';
import { buildAIContext, buildSystemPrompt } from '@/lib/ai/context-builder';
import { streamCompletion } from '@/lib/ai/client';
import { ConsentModal } from './consent-modal';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function BotPanel() {
  const { preferences, setPreference } = usePreferencesStore();
  const allNotes = useNotesStore((s) => s.allNotes);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [showConsent, setShowConsent] = useState(!preferences.aiConsentGiven);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConsentAccept = () => {
    setPreference('aiConsentGiven', true);
    setShowConsent(false);
  };

  const handleConsentCancel = () => {
    setPreference('aiEnabled', false);
    setShowConsent(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    if (!preferences.aiEndpoint || !preferences.aiApiKey || !preferences.aiModel) {
      setError('Configure your AI endpoint, model, and API key in Settings first.');
      return;
    }

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError('');
    setIsStreaming(true);

    const context = buildAIContext(userMsg.content, allNotes);
    const systemPrompt = buildSystemPrompt();
    const contextMessage = context
      ? `Here are relevant notes:\n\n${context}\n\n`
      : '';

    try {
      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: contextMessage + userMsg.content },
      ];

      let assistantContent = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      for await (const token of streamCompletion(
        preferences.aiEndpoint,
        preferences.aiApiKey,
        preferences.aiModel,
        chatMessages
      )) {
        assistantContent += token;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      }
    } catch (e) {
      setError(String(e));
      setMessages((prev) => prev.slice(0, -1)); // Remove empty assistant msg
    } finally {
      setIsStreaming(false);
    }
  };

  if (!preferences.aiEnabled) return null;

  return (
    <>
      <ConsentModal
        open={showConsent}
        onAccept={handleConsentAccept}
        onCancel={handleConsentCancel}
      />

      <div className="flex h-full w-72 flex-col border-s bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-4 w-4" />
            AI Assistant
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPreference('aiEnabled', false)}
            aria-label="Close AI panel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <article
            role="log"
            aria-live="polite"
            aria-label="AI conversation"
            className="space-y-3 p-3"
          >
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ask me anything about your notes…
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'ms-4 bg-primary text-primary-foreground'
                    : 'me-4 bg-muted'
                }`}
              >
                {msg.content || (isStreaming && i === messages.length - 1 ? '…' : '')}
              </div>
            ))}
          </article>
          <div ref={bottomRef} />
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="border-t px-3 py-2 text-xs text-destructive">{error}</div>
        )}

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a question…"
              disabled={isStreaming}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              aria-label="AI question input"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
