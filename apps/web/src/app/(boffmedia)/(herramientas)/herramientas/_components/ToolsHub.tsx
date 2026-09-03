"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Icon, Button, Empty, SearchInput } from "@boffmedia/ui"
import { GameLogo, ToolGrid, TxSection, VideoHero, buildHubGames } from "@/components/boffmedia/ui/tools"

const META = "inline-flex items-center gap-[0.5625rem] font-mono text-[0.75rem] uppercase leading-none tracking-[0.08em] text-txt-muted [&_b]:font-bold [&_b]:text-txt [&_svg]:text-accent"

export function ToolsHub() {
  const t = useTranslations()
  const tHub = useTranslations("toolsUi.hub")
  const games = React.useMemo(() => buildHubGames(t), [t])
  const [q, setQ] = React.useState("")

  const allTools = React.useMemo(
    () => games.flatMap((g) => g.tools.map((x) => ({ ...x, gameShort: g.short }))),
    [games],
  )
  const term = q.trim().toLowerCase()
  const results = term
    ? allTools.filter(
        (x) =>
          x.title.toLowerCase().includes(term) ||
          x.desc.toLowerCase().includes(term) ||
          x.gameShort.toLowerCase().includes(term),
      )
    : null

  return (
    <main>
      <VideoHero>
        {/* Hero rung — Landing only. The one surface allowed to be loud,
            because orientation is its whole job. */}
        <h1 className="mb-[1.125rem] text-[clamp(2.875rem,6.5vw,6rem)]">
          {tHub.rich("title", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className="max-w-[46ch] text-[1.25rem] leading-[1.5] text-txt-muted">{tHub("lead")}</p>

        <div className="mb-[1.625rem] mt-[1.875rem] max-w-[38.75rem]">
          <SearchInput
            size="lg"
            value={q}
            onChange={setQ}
            placeholder={tHub("searchPlaceholder")}
            ariaLabel={tHub("searchAria")}
          />
        </div>

        <div className="flex flex-wrap gap-x-[1.625rem] gap-y-3">
          <span className={META}>
            <Icon name="gamepad" size={15} /> <b>{games.length}</b> {tHub("games")}
          </span>
          <span className={META}>
            <Icon name="wrench" size={15} /> <b>{allTools.length}</b> {tHub("tools")}
          </span>
          <span className={META}>
            <Icon name="bolt" size={15} /> {tHub("alwaysUpdated")}
          </span>
        </div>
      </VideoHero>

      {/* `wrap-wide`, not `wrap`: this is the densest card grid on the site (every
          tool of every game) and `ToolGrid` is an auto-fill, so the wider cap is
          what turns the extra room on a large display into a fourth column
          instead of a wider margin. */}
      <div className="wrap-wide pb-10">
        {results ? (
          <div className="pt-[2.875rem]">
            {results.length === 0 ? (
              <Empty icon="search" title={tHub("noResults")} lead={tHub("noResultsFor", { query: q.trim() })}>
                <Button variant="pri" size="sm" onClick={() => setQ("")}>
                  {tHub("clearSearch")}
                </Button>
              </Empty>
            ) : (
              <TxSection title={tHub("results")} count={tHub("matches", { count: results.length })}>
                <ToolGrid tools={results} />
              </TxSection>
            )}
          </div>
        ) : (
          games.map((game) => (
            <section key={game.slug} className="border-t border-solid border-line pb-[0.625rem] pt-[3.25rem] first:border-t-0">
              <div className="mb-6 flex flex-wrap items-center gap-[1.125rem]">
                <GameLogo label={game.logoLabel} hueColor={game.hueColor} imageSrc={game.iconImg} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[clamp(1.75rem,3.4vw,2.75rem)]">{game.name}</h2>
                  <p className="mt-[0.3125rem] text-[0.9375rem] text-txt-muted">{game.tagline}</p>
                </div>
                <span className="mono-label flex-none max-sm:hidden">{tHub("toolCount", { count: game.tools.length })}</span>
                <Button size="sm" iconRight="arrow" href={game.href} className="flex-none">
                  {tHub("viewGame")}
                </Button>
              </div>
              <ToolGrid tools={game.tools} />
            </section>
          ))
        )}
      </div>
    </main>
  )
}
