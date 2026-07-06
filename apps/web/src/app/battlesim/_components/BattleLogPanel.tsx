'use client';

import { useTranslations } from 'next-intl';

import { useRef, useEffect, useState, useMemo } from 'react';
import { BSXTick, Segmented } from '@/components/boffmedia-v2/primitives';
import type { BSXTickEv } from '../_utils/toBSXMon';

export const VISIBLE_TICK_LIMIT = 50;
export const REPLAY_TICK_LIMIT = 200;

type LogFilter = 'all' | 'damage' | 'switches' | 'field';

function matchesFilter(ev: BSXTickEv, filter: LogFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'damage') return ev.kind === 'ko' || !!ev.dmg || !!ev.eff || !!ev.crit;
  if (filter === 'switches') return ev.kind === 'switch';
  if (filter === 'field') return ev.kind === 'field';
  return true;
}

interface TurnGroup {
  turn: number;
  events: BSXTickEv[];
}

function groupByTurn(ticks: BSXTickEv[]): TurnGroup[] {
  const groups: TurnGroup[] = [];
  let current: TurnGroup = { turn: 0, events: [] };
  for (const ev of ticks) {
    if (ev.turn != null) {
      if (current.events.length > 0 || current.turn > 0) groups.push(current);
      current = { turn: ev.turn, events: [] };
    } else {
      current.events.push(ev);
    }
  }
  groups.push(current);
  return groups.filter((g) => g.events.length > 0 || g.turn > 0);
}

interface BattleLogPanelProps {
  ticks: BSXTickEv[];
  limit?: number;
  className?: string;
  maxHeight?: number | string;
  /** Replay integration: highlights and scrolls to this turn group. */
  activeTurn?: number;
  /** Hide filter row (compact embeds). */
  showFilters?: boolean;
}

export function BattleLogPanel({
  ticks,
  limit = VISIBLE_TICK_LIMIT,
  className,
  maxHeight = 400,
  activeTurn,
  showFilters = true,
}: BattleLogPanelProps) {
  const t = useTranslations('battlesim');
  const filterOptions = [
    { value: 'all', label: t('log.filterAll') },
    { value: 'damage', label: t('log.filterDamage') },
    { value: 'switches', label: t('log.filterSwitches') },
    { value: 'field', label: t('log.filterField') },
  ];
  const logRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<LogFilter>('all');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom on new events (live mode, no active turn pin).
  useEffect(() => {
    if (activeTurn == null && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [ticks.length, activeTurn]);

  // Replay: scroll the active turn group into view.
  useEffect(() => {
    if (activeTurn != null && logRef.current) {
      const el = logRef.current.querySelector<HTMLElement>(`[data-turn="${activeTurn}"]`);
      el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [activeTurn]);

  const groups = useMemo(() => {
    const windowed = showAll ? ticks : ticks.slice(-limit);
    const filtered = filter === 'all' ? windowed : windowed.filter((ev) => ev.turn != null || matchesFilter(ev, filter));
    return groupByTurn(filtered);
  }, [ticks, showAll, limit, filter]);

  const latestTurn = groups.length > 0 ? groups[groups.length - 1].turn : 0;

  const toggleTurn = (turn: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(turn)) next.delete(turn);
      else next.add(turn);
      return next;
    });
  };

  const collapsePrevious = () => {
    setCollapsed(new Set(groups.filter((g) => g.turn !== latestTurn).map((g) => g.turn)));
  };

  return (
    <div
      className={`rounded-[var(--radius)] overflow-hidden flex flex-col ${className ?? ''}`}
      style={{ border: '1px solid var(--border)', background: 'var(--layer-1)' }}
    >
      {showFilters && (
        <div className="flex items-center gap-2 p-2 border-b border-edge" style={{ background: 'var(--layer-2)' }}>
          <Segmented value={filter} options={filterOptions} onChange={(v) => setFilter(v as LogFilter)} className="text-t-xs" />
          {groups.length > 1 && (
            <button
              onClick={collapsePrevious}
              className="bsx-focus ml-auto text-t-3xs font-mono uppercase tracking-[.06em] px-2 py-1 rounded-[var(--radius-sm)]"
              style={{ color: 'var(--text-dim)', background: 'var(--layer-3)' }}
              title={t('log.collapsePrevious')}
            >
              {t('log.collapsePrevious')}
            </button>
          )}
        </div>
      )}

      {ticks.length > limit && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="bsx-focus w-full text-t-xs py-1 transition-colors shrink-0"
          style={{ background: 'var(--layer-2)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
        >
          {t('log.showAll', { count: ticks.length })}
        </button>
      )}

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={t('log.label')}
        className="overflow-y-auto p-2 flex flex-col gap-0.5 flex-1 min-h-0"
        style={{ maxHeight }}
      >
        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.turn) && group.turn !== latestTurn && activeTurn !== group.turn;
          const isActive = activeTurn === group.turn;
          return (
            <div key={group.turn} data-turn={group.turn}>
              {group.turn > 0 && (
                <button
                  onClick={() => toggleTurn(group.turn)}
                  aria-expanded={!isCollapsed}
                  className="bsx-focus sticky top-0 z-[1] w-full flex items-center gap-[.55rem] pt-[.45rem] pb-[.15rem] font-mono font-bold text-t-3xs tracking-[.14em] cursor-pointer text-left"
                  style={{
                    color: isActive ? 'var(--text)' : 'var(--secondary-hover)',
                    background: 'var(--layer-1)',
                  }}
                >
                  <span>{isCollapsed ? '▸' : '▾'} T{group.turn}</span>
                  {isCollapsed && (
                    <span className="font-normal" style={{ color: 'var(--text-dim)' }}>
                      {t('log.events', { count: group.events.length })}
                    </span>
                  )}
                  <i className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, var(--accent-soft, var(--border)), transparent)' }} />
                </button>
              )}
              {!isCollapsed && group.events.map((ev, i) => <BSXTick key={`${group.turn}-${i}`} ev={ev as any} />)}
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="text-t-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>
            {t('log.empty')}
          </p>
        )}
      </div>
    </div>
  );
}
