'use client';

// The log lives in `BxLog` (bx-kit) now — filters, collapsible turns, pinned
// autoscroll, sanitised HTML. This file remains as the boxed wrapper the replay
// player imports, with the props it always had.
import { cn } from '@boffmedia/ui';
import { BxLog } from './bx-kit';
import type { BSXTickEv } from '../engine/toBSXMon';

export { VISIBLE_TICK_LIMIT, REPLAY_TICK_LIMIT } from './bx-kit';

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

export function BattleLogPanel({ ticks, limit, className, maxHeight = 400, activeTurn, showFilters = true }: BattleLogPanelProps) {
  return (
    <BxLog
      log={ticks}
      limit={limit}
      filters={showFilters}
      activeTurn={activeTurn}
      maxHeight={maxHeight}
      className={cn('border border-solid border-line', className)}
    />
  );
}
