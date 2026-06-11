'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Game } from '../_components/Game';
import { LigaService } from '@/services/api/smartrotom/ligaService';
import { ReplayData } from '../../types';
import { Loading } from '@/components/smartrotom/Loading';

export default function ReplayPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const [replayData, setReplayData] = useState<ReplayData | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = parseInt(name, 10);
    if (isNaN(id)) {
      setError('Invalid replay ID');
      setLoading(false);
      return;
    }

    LigaService.getReplay(id)
      .then((res) => {
        if (res.error || !res.data) {
          setError('Replay not found');
        } else {
          const r = res.data as any;
          setReplayData({
            side1: r.side1,
            side2: r.side2,
            team1: r.team1 ?? '',
            team2: r.team2 ?? '',
            replay: r.replay,
            winner: r.winner,
            createdAt: r.createdAt,
          });
        }
      })
      .catch(() => setError('Failed to load replay'))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: 'var(--bg)' }}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <Link href="/battlesim/replay" className="underline" style={{ color: 'var(--accent)' }}>Paste replay manually</Link>
      </div>
    );
  }

  return (
    <section className="flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Game battleName={name} replayData={replayData} />
    </section>
  );
}
