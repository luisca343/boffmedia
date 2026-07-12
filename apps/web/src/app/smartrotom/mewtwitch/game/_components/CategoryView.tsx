"use client"

import { useGame, useStreamsForGame } from "../../_hooks/useTwitch"
import { compactCount, toStreamCard, twitchThumb } from "../../_utils/twitch"
import { StreamSection } from "../../_components/StreamSection"

export function CategoryView({ id }: { id: string }) {
  const game = useGame(id)
  const streams = useStreamsForGame(id)
  const g = game.data
  const list = (streams.data ?? []).map(toStreamCard)
  const totalViewers = (streams.data ?? []).reduce((a, s) => a + s.viewer_count, 0)

  return (
    <div className="mx-auto max-w-[1640px] px-4 pb-20 pt-6 md:px-10">
      {g && (
        <div className="mb-3 grid grid-cols-[100px_1fr] items-center gap-7 border-b border-mw-line pb-7">
          <img src={twitchThumb(g.box_art_url, 200, 270)} alt="" className="w-[100px] rounded-mw-lg" />
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-mw-accent">Categoría</div>
            <h1 className="my-1.5 font-mw-display text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-0.01em]">{g.name}</h1>
            <div className="text-[13px] text-mw-fg-mute">
              <strong className="text-mw-fg">{compactCount(totalViewers)}</strong> espectadores · {list.length} directos
            </div>
          </div>
        </div>
      )}
      <StreamSection title="En directo ahora" streams={list} loading={streams.isLoading} />
    </div>
  )
}
