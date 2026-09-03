'use client';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { useRef, useEffect, useState } from 'react';
import { Button, cn } from '@boffmedia/ui';
import { sanitizeHtml } from '../engine/sanitizeHtml';
import { BSIM_FOCUS_CUT } from './bsim-kit';

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
  /** Kept for callers that box the panel themselves; the rail sizes it with flex. */
  maxHeight?: number | string;
  className?: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Battle/lobby chat: scrollback pinned to the newest line while the reader is
 * at the bottom, timestamps, enter-to-send. Tokens only, both hosts.
 */
export function ChatPanel({ messages, onSend, disabled, placeholder, emptyText, maxHeight, className }: ChatPanelProps) {
  const t = useToolT(BATTLESIM_NS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [input, setInput] = useState('');

  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const send = () => {
    const text = input.trim();
    if (!text || !onSend) return;
    onSend(text);
    setInput('');
  };

  const label = placeholder ?? t('chat.placeholder');

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col bg-panel', className)} style={maxHeight != null ? { maxHeight } : undefined}>
      <div ref={scrollRef} role="log" aria-label={t('chat.aria')} onScroll={onScroll}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {messages.length === 0 && (
          <p className="py-4 text-center font-mono text-[0.6875rem] text-txt-dim">{emptyText ?? t('chat.empty')}</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="break-words font-body text-[0.78125rem] leading-[1.45] text-txt-muted">
            {msg.timestamp != null && (
              <span className="mr-1 font-mono text-[0.5625rem] tabular-nums text-txt-dim">{formatTime(msg.timestamp)}</span>
            )}
            <span className="font-semibold text-accent-bright">{msg.sender}: </span>
            <span className="[&_b]:text-txt" dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.message) }} />
          </div>
        ))}
      </div>
      {!disabled && onSend && (
        <form className="flex shrink-0 gap-2 border-t border-solid border-line p-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input
            type="text"
            placeholder={label}
            aria-label={label}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={cn('cut-tag cut-tag-edge [--cut-tag:7px] [--cut-line:var(--line)]', BSIM_FOCUS_CUT, 'h-8 min-w-0 flex-1 border border-solid border-line bg-base px-[0.625rem] font-body text-[0.78125rem] text-txt placeholder:text-txt-dim focus:border-accent-line')}
          />
          <Button type="submit" size="sm" disabled={!input.trim()}>{t('chat.send')}</Button>
        </form>
      )}
    </div>
  );
}
