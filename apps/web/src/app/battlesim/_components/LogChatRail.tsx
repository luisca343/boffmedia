'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect, useRef } from 'react';
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
    <div
      className="flex flex-col rounded-[var(--radius)] overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div role="tablist" className="flex shrink-0" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        {(['log', 'chat'] as const).map((tabKey) => (
          <button
            key={tabKey}
            role="tab"
            aria-selected={tab === tabKey}
            onClick={() => setTab(tabKey)}
            className="bsx-focus flex-1 flex items-center justify-center gap-2 py-2 text-t-xs font-semibold uppercase tracking-[.08em] transition-colors duration-[var(--dur-fast)]"
            style={{
              color: tab === tabKey ? 'var(--text)' : 'var(--text-dim)',
              boxShadow: tab === tabKey ? 'inset 0 -2px 0 var(--accent-bright)' : undefined,
            }}
          >
            {tabKey === 'log' ? t('log.tab') : t('chat.tab')}
            {tabKey === 'chat' && unread > 0 && (
              <span
                className="font-mono text-t-4xs px-[.45em] py-[.14em] rounded-[var(--radius-pill)] text-white"
                style={{ background: 'var(--accent)' }}
                aria-label={t('chat.unread', { count: unread })}
              >
                {unread}
              </span>
            )}
          </button>
        ))}
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
