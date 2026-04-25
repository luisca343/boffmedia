'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Swords } from 'lucide-react';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import { decodeRecap } from '@/features/vgc-tracker/utils/recapShare';

interface Props {
  searchParams: Promise<{ d?: string }>;
}

export default function SharePage({ searchParams }: Props) {
  const { d } = use(searchParams);
  const summary = d ? decodeRecap(d) : null;

  if (!summary) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Swords size={40} className="mx-auto text-surface-700" />
        <p className="text-surface-400">This recap link is invalid or has expired.</p>
        <Link href="/pokemon/vgc/tracker" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
          Go to VGC Tracker
        </Link>
      </div>
    );
  }

  const winRate =
    summary.w + summary.l > 0
      ? Math.round((summary.w / (summary.w + summary.l)) * 100)
      : null;

  const eloDelta =
    summary.curElo !== undefined && summary.startElo !== undefined
      ? summary.curElo - summary.startElo
      : null;

  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      <div className="flex items-center gap-3">
        <Link
          href="/pokemon/vgc/tracker"
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-50 hover:bg-surface-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <p className="text-surface-500 text-sm">VGC Session Recap</p>
      </div>

      <div className="rounded-2xl bg-surface-950 border border-surface-800 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-surface-50 font-bold text-xl leading-tight">{summary.label}</h1>
            <p className="text-surface-500 text-sm mt-0.5">
              {summary.format} · {summary.reg}
              {summary.type === 'tournament' && (
                <span className="ml-2 text-amber-400 text-xs font-medium">Tournament</span>
              )}
            </p>
          </div>
          {winRate !== null && (
            <div className={`text-3xl font-bold tabular-nums ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {winRate}%
            </div>
          )}
        </div>

        {/* Record */}
        <div className="flex items-center gap-6">
          <ShareStat value={summary.w} label="W" color="text-green-400" />
          <ShareStat value={summary.l} label="L" color="text-red-400" />
          {summary.d > 0 && <ShareStat value={summary.d} label="D" color="text-yellow-400" />}

          {summary.type === 'ladder' && summary.curElo !== undefined && (
            <div className="ml-auto text-right">
              <p className="text-surface-50 font-bold text-xl tabular-nums">
                {summary.curElo}
                {eloDelta !== null && (
                  <span className={`text-sm ml-1.5 ${eloDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {eloDelta >= 0 ? '+' : ''}{Number(eloDelta.toFixed(1))}
                  </span>
                )}
              </p>
              {summary.bestElo !== undefined && (
                <p className="text-surface-600 text-xs">Peak {summary.bestElo}</p>
              )}
              <p className="text-surface-600 text-[10px]">ELO</p>
            </div>
          )}
        </div>

        {/* Sprites */}
        {summary.pkmn.length > 0 && (
          <div className="flex items-center gap-1 pt-4 border-t border-surface-800">
            {summary.pkmn.map((name) => (
              <img
                key={name}
                src={spriteUrl(name)}
                alt={name}
                title={name}
                className="w-12 h-12 object-contain"
                onError={handleSpriteError}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-surface-600 text-xs">
        Shared via{' '}
        <Link href="/pokemon/vgc/tracker" className="text-primary-500 hover:text-primary-400 transition-colors">
          Boffmedia VGC Tracker
        </Link>
      </p>
    </div>
  );
}

function ShareStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-surface-600 text-xs">{label}</p>
    </div>
  );
}
