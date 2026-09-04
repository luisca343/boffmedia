'use client';

import { useEffect, useState } from 'react';
import { toolApi } from '@boffmedia/tool-kit';
import { DkSkelList } from '@boffmedia/ui/datakit';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { Game } from '../components/replay/Game';
import { BsimErrorState, BsimScreenShell } from '../components/bsim-kit';
import { getReplay } from '../storage';
import type { ReplayData } from '../engine/types';
import { useBsimNav } from '../nav';

/**
 * One replay, from wherever it actually lives.
 *
 * THE CONTRACT, because two other screens depend on it:
 *
 *   nav.push("replayDetail", { id, source: "local" })  → the tool store, keyed
 *       by the battle's roomId. This is what a local AI battle produces:
 *       `keepReplay` writes the record under `id = roomId`, a uuid.
 *   nav.push("replayDetail", { id, source: "liga" })   → the league API, whose
 *       ids are integers.
 *
 * `source` is advisory rather than required: an id that is not an integer can
 * only be a local uuid, so a link that lost the query parameter still resolves.
 * The screen used to `parseInt` everything, so every local replay — the only
 * kind most players have — landed on "ID de repetición no válido".
 */
export function BsimReplayDetailView() {
  // The address comes from the nav seam, not from a route prop: the launcher
  // has no router to supply one, and `params: Promise<...>` is a Next App
  // Router signature this package must not depend on.
  const nav = useBsimNav();
  const id = nav.params.id ?? '';
  const source = nav.params.source ?? '';
  const t = useToolT(BATTLESIM_NS);

  const [replayData, setReplayData] = useState<ReplayData | undefined>();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErrorCode(null);
    setReplayData(undefined);

    if (!id) {
      setErrorCode('not_found');
      setLoading(false);
      return;
    }

    const numeric = /^\d+$/.test(id);
    const isLocal = source === 'local' || !numeric;

    if (isLocal) {
      void getReplay(id)
        .then((record) => {
          if (!alive) return;
          if (!record) {
            setErrorCode('not_found');
            return;
          }
          setReplayData({
            side1: record.p1,
            side2: record.p2,
            team1: '',
            team2: '',
            replay: record.log,
            // `ReplayData.winner` is a number the player never reads — the
            // winner the viewer shows comes out of the `|win|` line in the log.
            winner: 0,
            createdAt: new Date(record.playedAt).toISOString(),
          });
        })
        .catch(() => {
          if (alive) setErrorCode('not_found');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }

    toolApi()
      .request<{ data?: Record<string, string> }>(`/smartrotom/liga/replay/${id}`)
      .then((res) => {
        if (!alive) return;
        const r = res?.data;
        if (!r) {
          setErrorCode('not_found');
          return;
        }
        setReplayData({
          side1: r.side1,
          side2: r.side2,
          team1: r.team1 ?? '',
          team2: r.team2 ?? '',
          replay: r.replay,
          winner: 0,
          createdAt: r.createdAt,
        });
      })
      .catch(() => {
        if (alive) setErrorCode('connect_failed');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, source]);

  if (loading) {
    return (
      <BsimScreenShell>
        <div className="flex flex-col gap-3">
          <p role="status" className="sr-only">{t('hub.replays.loading')}</p>
          <DkSkelList rows={1} h={340} />
          <DkSkelList rows={1} h={54} />
        </div>
      </BsimScreenShell>
    );
  }

  if (errorCode) {
    return (
      <BsimScreenShell>
        <BsimErrorState code={errorCode} />
      </BsimScreenShell>
    );
  }

  // NO `BsimScreenShell` around the player itself. It wears the battle shell
  // now — `h-[var(--tool-vh)]`, its own bar, its own rail — and a padded page
  // body around that is exactly what made the replay a postage stamp with a
  // scrollbar. The loading and error states above still get the page chrome.
  return <Game replayData={replayData} />;
}
