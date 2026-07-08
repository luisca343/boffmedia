'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BattleLogPanel } from './BattleLogPanel';
import { ChatPanel, type ChatPanelMessage } from './ChatPanel';
import type { BSXTickEv } from '../_utils/toBSXMon';

interface LogChatRailProps {
  ticks: BSXTickEv[];
  maxHeight: number;
  chat?: {
    messages: ChatPanelMessage[];
    onSend?: (message: string) => void;
    disabled?: boolean;
  };
}

/**
 * Battle side rail: full-height tabbed Log | Chat with unread badge.
 * Without chat, renders the log alone.
 */
export function LogChatRail({ ticks, maxHeight, chat }: LogChatRailProps) {
  const t = useTranslations('battlesim');
  const [tab, setTab] = useState<'log' | 'chat'>('log');
  const [unread, setUnread] = useState(0);
  const seenCount = useRef(0);

  useEffect(() => {
    if (!chat) return;
    if (tab === 'chat') {
      seenCount.current = chat.messages.length;
      setUnread(0);
    } else {
      setUnread(Math.max(0, chat.messages.length - seenCount.current));
    }
  }, [chat?.messages.length, tab, chat]);

  if (!chat) {
    return <BattleLogPanel ticks={ticks} maxHeight={maxHeight} />;
  }

  return (
    <div className="flex flex-col overflow-hidden border border-solid border-line bg-panel">
      <div role="tablist" className="flex shrink-0 border-b border-solid border-line bg-base">
        {(['log', 'chat'] as const).map((tabKey) => {
          const on = tab === tabKey
          return (
            <button
              key={tabKey}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(tabKey)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none",
                on ? "text-txt shadow-[inset_0_-2px_0_var(--accent)]" : "text-txt-dim hover:text-txt-muted",
              )}
            >
              {tabKey === 'log' ? t('log.tab') : t('chat.tab')}
              {tabKey === 'chat' && unread > 0 && (
                <span
                  className="bg-accent px-[5px] py-[2px] font-mono text-[9px] font-bold leading-none text-accent-ink"
                  aria-label={t('chat.unread', { count: unread })}
                >
                  {unread}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'log' ? (
        <BattleLogPanel ticks={ticks} maxHeight={maxHeight} className="border-0 rounded-none" />
      ) : (
        <ChatPanel
          messages={chat.messages}
          onSend={chat.onSend}
          disabled={chat.disabled}
          maxHeight={maxHeight}
          placeholder={t('chat.battlePlaceholder')}
          emptyText={t('chat.battleEmpty')}
        />
      )}
    </div>
  );
}
