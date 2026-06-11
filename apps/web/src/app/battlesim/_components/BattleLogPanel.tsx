'use client';

import { useRef, useEffect, useState } from 'react';
import { BSXTick } from '@/components/boffmedia/primitives';

export const VISIBLE_TICK_LIMIT = 50;

interface BattleLogPanelProps {
  ticks: Array<{ turn: number; html: string; [key: string]: any }>;
  limit?: number;
}

export function BattleLogPanel({ ticks, limit = VISIBLE_TICK_LIMIT }: BattleLogPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [ticks.length]);

  const visibleTicks = showAll ? ticks : ticks.slice(-limit);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {ticks.length > limit && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs py-1 transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          Show all ({ticks.length})
        </button>
      )}
      <div
        ref={logRef}
        className="overflow-y-auto p-2 flex flex-col gap-0.5"
        style={{ maxHeight: '400px', background: 'var(--surface)' }}
      >
        {visibleTicks.map((tick, i) => (
          <BSXTick key={`${tick.turn}-${i}`} turn={tick.turn} html={tick.html} />
        ))}
      </div>
    </div>
  );
}
