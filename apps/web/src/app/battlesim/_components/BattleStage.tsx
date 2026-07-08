'use client';

import type { ReactNode } from 'react';
import { BxScore, BxOrder } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_components/ui/bx-kit';
import type { OrderSlot } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_lib/bx-helpers';
import { cn } from '@/lib/utils';
import type { BSXLayout } from '../_hooks/useBSXLayout';

interface BattleStageProps {
  bsx: BSXLayout;
  /** The battle canvas. */
  children: ReactNode;
  /** Show the projected speed-order rail (foe speeds are estimates). */
  showOrderRail?: boolean;
  /** Hide score plates and order rail (fullscreen immersive mode). */
  fullscreen?: boolean;
}

/**
 * Field-first stage wrapper: player score plates over the canvas,
 * the canvas itself, and the projected speed order underneath.
 */
export function BattleStage({ bsx, children, showOrderRail = false, fullscreen = false }: BattleStageProps) {
  const orderSlots = [
    bsx.bsxAlly ? { side: 'ally', idx: 0, mon: bsx.bsxAlly } : null,
    bsx.bsxFoe ? { side: 'foe', idx: 0, mon: bsx.bsxFoe } : null,
  ].filter(Boolean) as OrderSlot[];

  return (
    <div className={cn('flex min-w-0 flex-col gap-2 animate-appear', fullscreen && 'h-full')}>
      {!fullscreen && (bsx.bsxScoreP1 || bsx.bsxScoreP2) && (
        <div className="flex min-w-0 flex-wrap justify-between gap-2">
          {bsx.bsxScoreP1 && (
            <BxScore
              name={bsx.bsxScoreP1.name}
              rating={bsx.bsxScoreP1.rating}
              av={bsx.bsxScoreP1.av}
              team={bsx.bsxScoreP1.team}
            />
          )}
          {bsx.bsxScoreP2 && (
            <BxScore
              name={bsx.bsxScoreP2.name}
              rating={bsx.bsxScoreP2.rating}
              av={bsx.bsxScoreP2.av}
              team={bsx.bsxScoreP2.team}
              right
            />
          )}
        </div>
      )}

      {children}

      {showOrderRail && orderSlots.length > 1 && <BxOrder slots={orderSlots} />}
    </div>
  );
}
