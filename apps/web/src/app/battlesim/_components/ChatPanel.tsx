'use client';

import { useTranslations } from 'next-intl';

import { useRef, useEffect, useState } from 'react';
import { sanitizeHtml } from '../_utils/sanitizeHtml';

export interface ChatPanelMessage {
  sender: string;
  message: string;
  timestamp?: number;
}

interface ChatPanelProps {
  messages: ChatPanelMessage[];
  onSend?: (message: string) => void;
  /** Hide the input (spectator / battle finished). */
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  maxHeight?: number | string;
  className?: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Reusable battle/lobby chat: scrollback, sender colors, timestamps,
 * enter-to-send input. Used by Showdown and PvP surfaces.
 */
export function ChatPanel({
  messages,
  onSend,
  disabled,
  placeholder,
  emptyText,
  maxHeight = 300,
  className,
}: ChatPanelProps) {
  const t = useTranslations('battlesim');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = () => {
    const text = input.trim();
    if (!text || !onSend) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className={`flex flex-col min-h-0 ${className ?? ''}`}>
      <div
        ref={scrollRef}
        role="log"
        aria-label={t('chat.aria')}
        className="flex-1 overflow-y-auto p-2 space-y-0.5 text-sm min-h-0"
        style={{ maxHeight }}
      >
        {messages.length === 0 && (
          <p className="text-t-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>{emptyText ?? t('chat.empty')}</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-t-xs break-words relative z-[999]" style={{ color: 'var(--text-muted)' }}>
            {msg.timestamp != null && (
              <span className="font-mono text-t-4xs mr-1 tabular-nums" style={{ color: 'var(--text-dim)' }}>
                {formatTime(msg.timestamp)}
              </span>
            )}
            <span style={{ color: 'var(--secondary-hover)', fontWeight: 600 }}>{msg.sender}: </span>
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.message) }} />
          </div>
        ))}
      </div>
      {!disabled && onSend && (
        <div className="p-2 flex gap-2 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder={placeholder ?? t('chat.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="bsx-focus flex-1 px-2 py-1.5 rounded-[var(--radius-sm)] text-t-xs"
            style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            aria-label={placeholder ?? t('chat.placeholder')}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="bsx-focus px-3 py-1.5 rounded-[var(--radius-sm)] text-t-xs font-medium disabled:opacity-50"
            style={{ background: 'var(--layer-3)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {t('chat.send')}
          </button>
        </div>
      )}
    </div>
  );
}
