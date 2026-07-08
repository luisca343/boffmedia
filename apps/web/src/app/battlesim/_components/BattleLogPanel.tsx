'use client';

import { useTranslations } from 'next-intl';

import { useRef, useEffect, useState, useMemo } from 'react';
import { BxTick } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_components/ui/bx-kit';
import { DkSeg } from '@/components/boffmedia/ui/tools/datakit';
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
      className={`flex flex-col overflow-hidden border border-solid border-line bg-panel ${className ?? ''}`}
    >
      {showFilters && (
        <div className="flex items-center gap-2 border-b border-solid border-line bg-base p-2">
          <DkSeg
            size="sm"
            value={filter}
            options={filterOptions}
            onChange={(v) => setFilter(v as LogFilter)}
            ariaLabel={t('log.label')}
          />
          {groups.length > 1 && (
            <button
              type="button"
              onClick={collapsePrevious}
              className="ml-auto border border-solid border-line-2 px-2 py-1 font-mono text-[10px] uppercase leading-none tracking-[0.06em] text-txt-dim transition-colors hover:text-txt focus-visible:outline-none"
              title={t('log.collapsePrevious')}
            >
              {t('log.collapsePrevious')}
            </button>
          )}
        </div>
      )}

      {ticks.length > limit && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full shrink-0 border-b border-solid border-line bg-base py-1 font-mono text-[10.5px] text-txt-muted transition-colors hover:text-txt focus-visible:outline-none"
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
                  type="button"
                  onClick={() => toggleTurn(group.turn)}
                  aria-expanded={!isCollapsed}
                  className={`sticky top-0 z-[1] flex w-full cursor-pointer items-center gap-[10px] bg-panel pb-[3px] pt-[7px] text-left font-mono text-[11px] font-extrabold leading-none tracking-[0.14em] focus-visible:outline-none ${isActive ? 'text-txt' : 'text-accent-bright'}`}
                >
                  <span>{isCollapsed ? '▸' : '▾'} T{group.turn}</span>
                  {isCollapsed && (
                    <span className="font-normal text-txt-dim">
                      {t('log.events', { count: group.events.length })}
                    </span>
                  )}
                  <i className="h-px flex-1 bg-[linear-gradient(90deg,var(--accent-line),transparent)]" />
                </button>
              )}
              {!isCollapsed && group.events.map((ev, i) => <BxTick key={`${group.turn}-${i}`} ev={ev} />)}
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="py-4 text-center font-mono text-[11px] text-txt-dim">
            {t('log.empty')}
          </p>
        )}
      </div>
    </div>
  );
}
