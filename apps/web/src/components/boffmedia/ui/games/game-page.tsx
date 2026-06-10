"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { getGameEntry, getLandingItems } from "@/data/games"
import { GameHeroBanner } from "./game-hero-banner"
import { ToolCardFav } from "../tools/tool-card-fav"
import { SearchInput } from "../../primitives/search-input"
import { EmptyState } from "../../primitives/empty-state"
import { BoffButton as Button } from "../../primitives/button"
import { Icon } from "../../primitives/icon"
import { FeaturedTool } from "../tools/featured-tool"
import { Breadcrumb } from "../../primitives/breadcrumb"

const HUE_MAP: Record<string, number> = {
  mhwilds: 130,
  pokemon: 220,
  otros: 180,
}

const ICON_NAME_MAP: Record<string, string> = {
  Shield: "shield",
  Sword: "sword",
  Axe: "wrench",
  Diamond: "star",
  Zap: "zap",
  Database: "database",
  Gift: "bookmark",
  Key: "wrench",
}

interface GamePageProps {
  slug: string
}

export function GamePage({ slug }: GamePageProps) {
  const router = useRouter()
  const t = useTranslations(slug)
  const game = useMemo(() => getGameEntry(slug)!, [slug])
  const landingItems = useMemo(() => getLandingItems(slug), [slug])
  const [q, setQ] = useState("")

  const go = (path: string) => router.push(path)

  const featuredLandingItem = useMemo(
    () => landingItems.find((item) => item.featured),
    [landingItems],
  )

  const featuredTool = useMemo(() => {
    if (!featuredLandingItem) return null
    const item = featuredLandingItem
    return {
      title: t(`tools.${item.key}.title`),
      desc: t(`tools.${item.key}.description`),
      icon: ICON_NAME_MAP[item.fallbackIcon] || "wrench",
      features: item.features.map((f: string) =>
        t(`tools.${item.key}.features.${f}`),
      ),
      href: item.href.startsWith("/") ? item.href : `/${item.href}`,
      isNew: item.isNew ?? false,
      heroImage: item.heroImage,
      iconSrc: item.icon,
    }
  }, [featuredLandingItem, t])

  const otherTools = useMemo(
    () =>
      landingItems
        .filter((item) => !item.featured)
        .map((item) => ({
          title: t(`tools.${item.key}.title`),
          desc: t(`tools.${item.key}.description`),
          icon: ICON_NAME_MAP[item.fallbackIcon] || "wrench",
          features: item.features.map((f: string) =>
            t(`tools.${item.key}.features.${f}`),
          ),
          href: item.href.startsWith("/") ? item.href : `/${item.href}`,
          isNew: item.isNew ?? false,
          popularity: item.popularity,
        })),
    [landingItems, t],
  )

  const filteredTools = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return otherTools
    return otherTools.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.desc.toLowerCase().includes(term),
    )
  }, [otherTools, q])

  const hue = HUE_MAP[slug] ?? 200

  const externalLinks = useMemo(
    () =>
      game.externalLinks.map((link) => ({
        href: link.href,
        title: t(`externalLinks.${link.key}`),
        desc: link.desc,
      })),
    [game.externalLinks, t],
  )

  return (
    <>
      <GameHeroBanner
        variant="banner"
        kicker={t("header.title.prefix")}
        title={t("header.title.highlight")}
        subtitle={t("header.subtitle")}
        hue={hue}
        logoLabel={slug.charAt(0).toUpperCase()}
        imageSrc={game.bannerImage}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Herramientas", href: "/herramientas" },
              { label: t("title") },
            ]}
            go={go}
          />
        }
      />

      <div
        className="gamesection relative isolate"
        data-bg="wash"
        style={{ "--hue": hue } as React.CSSProperties}
      >
        <div
          className="gamesection__bg absolute inset-0 z-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
          style={{
            background: [
              `radial-gradient(70% 55% at 82% -8%, oklch(0.62 0.16 ${hue} / 0.16), transparent 72%)`,
              `radial-gradient(55% 45% at 6% 4%, oklch(0.55 0.15 ${hue + 35} / 0.10), transparent 70%)`,
              `linear-gradient(180deg, oklch(0.5 0.12 ${hue} / 0.06), transparent 38%)`,
            ].join(", "),
          }}
        />

        <div
          className="gamepage relative z-[1] mx-auto px-[var(--gutter)]"
          style={{ maxWidth: "1080px", padding: "2rem var(--gutter) 5rem" }}
        >
          {featuredTool && (
            <FeaturedTool
              tool={{
                ...featuredTool,
                hue,
              }}
              go={go}
            />
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h2 className="font-display font-extrabold text-[length:var(--t-2xl)]">
              Todas las herramientas
            </h2>
            <div className="w-[min(320px,100%)]">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder={`Buscar en ${slug}…`}
              />
            </div>
          </div>

          {filteredTools.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              sub={`Nada coincide con "${q}".`}
              action={
                <Button variant="ghost" onClick={() => setQ("")}>
                  Limpiar
                </Button>
              }
            />
          ) : (
            <section className="mb-12">
              <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
                {filteredTools.map((tool, i) => (
                  <ToolCardFav
                    key={tool.href}
                    tool={tool}
                    go={go}
                    delay={i * 50}
                  />
                ))}
              </div>
            </section>
          )}

          {externalLinks.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                <h2 className="font-display font-extrabold text-[length:var(--t-2xl)]">
                  Recursos externos
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-[0.85rem] max-[900px]:grid-cols-1">
                {externalLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-4 px-5 py-4 rounded-[var(--radius-lg)] bg-[var(--card-bg)] border border-[var(--border)] shadow-[var(--card-shadow)] backdrop-blur-[10px] transition-all duration-[var(--dur)] hover:border-[color-mix(in_srgb,var(--orange-500)_45%,var(--border))] hover:-translate-y-0.5 group"
                  >
                    <div>
                      <span className="block font-semibold text-[length:var(--t-sm)]">
                        {link.title}
                      </span>
                      {link.desc && (
                        <span className="text-[length:var(--t-xs)] text-[var(--text-muted)]">
                          {link.desc}
                        </span>
                      )}
                    </div>
                    <Icon
                      name="external"
                      size={16}
                      className="shrink-0 text-[var(--text-dim)] transition-colors duration-[var(--dur)] group-hover:text-[var(--orange-500)]"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
