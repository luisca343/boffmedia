"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Kicker, Icon, Button, Empty } from "@/components/boffmedia/primitives"
import { GameLogo, ToolGrid, TxSection, VideoHero, buildHubGames } from "@/components/boffmedia/ui/tools"

const META = "inline-flex items-center gap-[9px] font-mono text-[12px] uppercase leading-none tracking-[0.08em] text-txt-muted [&_b]:font-bold [&_b]:text-txt [&_svg]:text-accent"

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
        <Kicker>{tHub("kicker")}</Kicker>
        <h1 className="mb-[18px] mt-5 text-[clamp(52px,7vw,108px)]">
          {tHub.rich("title", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className="max-w-[46ch] text-[20px] leading-[1.5] text-txt-muted">{tHub("lead")}</p>

        <div className="mb-[26px] mt-[30px] max-w-[620px]">
          <div className="flex h-[50px] items-center gap-[10px] border border-solid border-line bg-panel px-4 text-txt-dim transition-[border-color] duration-[140ms] focus-within:border-accent focus-within:text-txt-muted">
            <Icon name="search" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tHub("searchPlaceholder")}
              aria-label={tHub("searchAria")}
              className="min-w-0 flex-1 border-0 bg-transparent text-txt outline-0 placeholder:text-txt-dim"
            />
            {q && (
              <button type="button" aria-label={tHub("clear")} onClick={() => setQ("")} className="text-txt-muted hover:text-txt">
                <Icon name="x" size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-[26px] gap-y-3">
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

      <div className="wrap pb-10">
        {results ? (
          <div className="pt-[46px]">
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
            <section key={game.slug} className="border-t border-solid border-line pb-[10px] pt-[52px] first:border-t-0">
              <div className="mb-6 flex flex-wrap items-center gap-[18px]">
                <GameLogo label={game.logoLabel} hueColor={game.hueColor} imageSrc={game.iconImg} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[clamp(28px,3.4vw,44px)]">{game.name}</h2>
                  <p className="mt-[5px] text-[15px] text-txt-muted">{game.tagline}</p>
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
