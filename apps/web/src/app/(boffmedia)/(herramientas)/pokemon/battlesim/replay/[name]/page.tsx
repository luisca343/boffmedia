'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Game } from '@/app/battlesim/replay/_components/Game';
import { LigaService } from '@/services/api/smartrotom/ligaService';
import type { ReplayData } from '@/app/battlesim/types';
import { Spinner } from "@/components/boffmedia/primitives"

export default function ReplayPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const t = useTranslations('battlesim');
  const [replayData, setReplayData] = useState<ReplayData | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = parseInt(name, 10);
    if (isNaN(id)) {
      setError(t('replay.invalidId'));
      setLoading(false);
      return;
    }
    LigaService.getReplay(id)
      .then((res) => {
        if (res.error || !res.data) {
          setError(t('replay.notFound'));
        } else {
          const r = res.data as any;
          setReplayData({
            side1: r.side1, side2: r.side2, team1: r.team1 ?? '', team2: r.team2 ?? '',
            replay: r.replay, winner: r.winner, createdAt: r.createdAt,
          });
        }
      })
      .catch(() => setError(t('replay.loadFailed')))
      .finally(() => setLoading(false));
  }, [name, t]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-base">
        <Spinner size={44} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-base px-4 text-txt">
        <p className="text-txt-muted">{error}</p>
        <Link href="/pokemon/battlesim/replay" className="text-accent-bright underline">{t('replay.pasteManually')}</Link>
      </div>
    );
  }

  return (
    <section className="flex flex-col bg-base text-txt">
      <Game battleName={name} replayData={replayData} />
    </section>
  );
}
