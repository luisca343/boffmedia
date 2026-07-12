"use client"

import { useSearchParams } from "next/navigation"
import { ChipRail } from "@/components/smartrotom/media"
import { useSearchStreams, useTopGames, useTopStreams } from "../_hooks/useTwitch"
import { MEWTWITCH_BASE, toCategoryCard, toStreamCard, twitchThumb, uptimeFrom } from "../_utils/twitch"
import { MewtwitchHero } from "./MewtwitchHero"
import { StreamSection } from "./StreamSection"
import { CategoryRail } from "./CategoryRail"

export function Home() {
  const params = useSearchParams()
  const q = params.get("q") ?? ""
  const searching = q.trim().length > 0

  const top = useTopStreams()
  const games = useTopGames()
  const search = useSearchStreams(q)

  if (searching) {
    const results = (search.data ?? []).map(toStreamCard)
    return (
      <>
        <ChipRail />
        <div className="mx-auto max-w-[1640px] px-4 pb-20 pt-5 md:px-10">
          <StreamSection title={`Resultados para «${q}»`} streams={results} loading={search.isLoading} />
        </div>
      </>
    )
  }

  const streams = top.data ?? []
  const hero = streams[0]
  const rest = streams.slice(1).map(toStreamCard)
  const cats = (games.data ?? []).map(toCategoryCard)

  return (
    <>
      <ChipRail />
      {hero && (
        <MewtwitchHero
          data={{
            href: `${MEWTWITCH_BASE}/stream/${hero.user_login}`,
            thumb: twitchThumb(hero.thumbnail_url, 1280, 720),
            title: hero.title,
            streamer: hero.user_name,
            game: hero.game_name,
            viewers: hero.viewer_count,
            uptime: uptimeFrom(hero.started_at),
            tags: hero.tags?.slice(0, 5) ?? [],
          }}
        />
      )}
      <div className="mx-auto max-w-[1640px] px-4 pb-20 pt-5 md:px-10">
        <StreamSection eyebrow="En directo" title="Directos populares ahora" streams={rest} loading={top.isLoading} />
        {top.isError && (
          <p className="py-4 text-center text-sm text-mw-fg-faint">
            No se pudo conectar con Twitch. Revisa las credenciales de la API.
          </p>
        )}
        <CategoryRail eyebrow="Explora" title="Categorías principales" categories={cats} loading={games.isLoading} />
      </div>
    </>
  )
}
