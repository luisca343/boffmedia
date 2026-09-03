'use client';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { useState, useEffect, useRef, useId, type KeyboardEvent } from 'react';
import { Icon, cn } from '@boffmedia/ui';
import { BxLog } from './bx-kit';
import { ChatPanel, type ChatPanelMessage } from './ChatPanel';
import { BSIM_FOCUS } from './bsim-kit';
import type { BSXTickEv } from '../engine/toBSXMon';

export type RailTab = 'log' | 'chat';

export interface RailChat {
  messages: ChatPanelMessage[];
  onSend?: (message: string) => void;
  disabled?: boolean;
}

interface LogChatRailProps {
  ticks: BSXTickEv[];
  chat?: RailChat;
  /** Controlled tab (the mobile sheet drives it from its tab bar). */
  tab?: RailTab;
  onTabChange?: (tab: RailTab) => void;
  /** Close affordance for the tablet drawer / mobile sheet. */
  onClose?: () => void;
  className?: string;
  limit?: number;
}

/**
 * Counts chat messages the reader has not seen: everything that arrived
 * while the chat tab was not showing. Shared by the rail and the header
 * badge so both agree.
 */
export function useUnreadChat(chat: RailChat | undefined, visible: boolean): number {
  const [unread, setUnread] = useState(0);
  const seen = useRef(0);
  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    if (!chat) return;
    if (visible) { seen.current = count; setUnread(0); }
    else setUnread(Math.max(0, count - seen.current));
  }, [count, visible, chat]);
  return unread;
}

/**
 * The battle side rail: Log | Chat as a real tablist (roving tabindex, arrow
 * keys, panels), unread dot on chat. Without chat, the log alone.
 */
export function LogChatRail({ ticks, chat, tab: tabProp, onTabChange, onClose, className, limit }: LogChatRailProps) {
  const t = useToolT(BATTLESIM_NS);
  const [tabState, setTabState] = useState<RailTab>('log');
  const tab = tabProp ?? tabState;
  const setTab = (next: RailTab) => { setTabState(next); onTabChange?.(next); };
  const unread = useUnreadChat(chat, tab === 'chat');
  const baseId = useId();
  const tabRefs = useRef<Record<RailTab, HTMLButtonElement | null>>({ log: null, chat: null });

  const tabs: RailTab[] = chat ? ['log', 'chat'] : ['log'];

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const i = tabs.indexOf(tab);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    setTab(tabs[next]);
    tabRefs.current[tabs[next]]?.focus();
  };

  const showTabs = !!chat || !!onClose;

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col bg-panel text-txt', className)}>
      {showTabs && (
        <div className="flex shrink-0 items-stretch border-b border-solid border-line bg-base">
          <div role="tablist" aria-label={t('battle.header.openLog')} className="flex min-w-0 flex-1">
            {tabs.map((key) => {
              const on = tab === key;
              return (
                <button
                  key={key}
                  ref={(el) => { tabRefs.current[key] = el; }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${key}`}
                  aria-selected={on}
                  aria-controls={`${baseId}-panel-${key}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setTab(key)}
                  onKeyDown={onKey}
                  className={cn(BSIM_FOCUS, 'flex h-10 flex-1 items-center justify-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors duration-[140ms] focus-visible:outline-offset-[-3px]',
                    on ? 'text-txt [box-shadow:inset_0_-2px_0_var(--accent)]' : 'text-txt-dim hover:text-txt-muted')}
                >
                  {key === 'log' ? t('battle.rail.log') : t('battle.rail.chat')}
                  {key === 'chat' && unread > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <i aria-hidden className="h-2 w-2 bg-accent [clip-path:circle(50%)]" />
                      <span className="sr-only">{t('battle.rail.unread', { count: unread })}</span>
                      <span aria-hidden className="font-mono text-[9px] font-bold text-accent-bright">{unread}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label={t('battle.rail.close')}
              className={cn(BSIM_FOCUS, 'grid h-10 w-10 flex-none place-items-center border-l border-solid border-line text-txt-muted transition-colors duration-[140ms] hover:text-txt focus-visible:outline-offset-[-3px]')}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      )}

      <div role={showTabs ? 'tabpanel' : undefined} id={`${baseId}-panel-log`} aria-labelledby={showTabs ? `${baseId}-tab-log` : undefined} hidden={tab !== 'log'}
        className={cn('min-h-0 flex-1 flex-col', tab === 'log' ? 'flex' : 'hidden')}>
        <BxLog log={ticks} limit={limit} className="min-h-0 flex-1" />
      </div>
      {chat && (
        <div role="tabpanel" id={`${baseId}-panel-chat`} aria-labelledby={`${baseId}-tab-chat`} hidden={tab !== 'chat'}
          className={cn('min-h-0 flex-1 flex-col', tab === 'chat' ? 'flex' : 'hidden')}>
          <ChatPanel messages={chat.messages} onSend={chat.onSend} disabled={chat.disabled}
            placeholder={t('chat.battlePlaceholder')} emptyText={t('chat.battleEmpty')} />
        </div>
      )}
    </div>
  );
}
