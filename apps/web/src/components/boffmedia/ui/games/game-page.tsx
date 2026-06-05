"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { getGameEntry, getLandingItems } from "@/data/games"
import { Breadcrumb } from "../../primitives/breadcrumb"
import { GameHeader } from "./game-header"
import { ToolCardFav } from "../tools/tool-card-fav"
import { SearchInput } from "../../primitives/search-input"
import { EmptyState } from "../../primitives/empty-state"
import { BoffButton as Button } from "../../primitives/button"
import { Icon } from "../../primitives/icon"
import { BoffBadge as Badge } from "../../primitives/badge"
import { IconBox } from "../../primitives/icon-box"

const HUE_MAP: Record<string, number> = {
  mhwilds: 30,
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
    <div
      className="mx-auto px-[var(--gutter)] pb-20"
      style={{ maxWidth: "1080px", paddingTop: "2rem" }}
    >
      <Breadcrumb
        go={go}
        items={[
          { label: "Herramientas", href: "/herramientas" },
          { label: slug },
        ]}
      />

      <GameHeader
        prefix={t("header.title.prefix")}
        highlight={t("header.title.highlight")}
        subtitle={t("header.subtitle")}
        logoSrc={game.logo}
        logoAlt={game.nameKey}
        hue={hue}
      />

      {featuredTool && (
        <div className="grid grid-cols-[1.3fr_1fr] overflow-hidden mb-12 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] backdrop-blur-[14px] max-[620px]:grid-cols-1">
          <div className="p-8 flex flex-col gap-[1.1rem]">
            <div className="flex items-center gap-4">
                    <div className="shrink-0">
                  {featuredTool.iconSrc ? (
                    <div className="w-[60px] h-[60px] rounded-[var(--radius-lg,22px)] grid place-items-center overflow-hidden bg-[color-mix(in_srgb,var(--orange-500)_13%,transparent)] border border-solid border-[color-mix(in_srgb,var(--orange-500)_28%,transparent)] shadow-[0_0_30px_-8px_var(--orange-500)]">
                      <Image
                        src={featuredTool.iconSrc}
                        alt=""
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <IconBox icon={featuredTool.icon} size="lg" tone="orange" className="shadow-[0_0_24px_-10px_var(--orange-500)]" />
                  )}
                </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display font-extrabold text-[length:var(--t-3xl)] leading-[1.08]">
                    {featuredTool.title}
                  </h2>
                  {featuredTool.isNew && <Badge kind="new">Nuevo</Badge>}
                </div>
                <span className="inline-flex items-center gap-[0.4rem] font-mono text-[length:var(--t-xs)] tracking-[0.08em] uppercase text-[var(--accent-bright)] mt-[0.3rem]">
                  <Icon name="sparkles" size={13} /> Herramienta destacada
                </span>
              </div>
            </div>
            <p className="text-[length:var(--t-base)] leading-[1.7] m-0 text-[var(--text-muted)]">
              {featuredTool.desc}
            </p>
            <div className="flex flex-wrap gap-2">
              {featuredTool.features.map((f: string) => (
                <Badge key={f} kind="accent">
                  {f}
                </Badge>
              ))}
            </div>
            <Button
              variant="primary"
              size="lg"
              iconRight="arrow"
              onClick={() => go(featuredTool.href)}
              className="self-start mt-1"
            >
              Abrir {featuredTool.title}
            </Button>
          </div>
          <div className="relative min-h-[280px] max-[620px]:min-h-[200px]">
            <div className="w-full h-full border-0 border-l-[var(--hairline)] border-dashed border-l-[var(--border-strong)] bg-[var(--surface-3)] max-[620px]:border-l-0 max-[620px]:border-t-[var(--hairline)] max-[620px]:border-t-dashed max-[620px]:border-t-[var(--border-strong)]">
              {featuredTool.heroImage ? (
                <Image
                  src={featuredTool.heroImage}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <span className="font-mono text-[length:var(--t-xs)] text-[var(--text-dim)]">
                    Placeholder
                  </span>
                </div>
              )}
            </div>
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-[0.4rem] font-mono text-[length:var(--t-xs)] px-[0.7rem] py-[0.4rem] rounded-full bg-black/60 text-white backdrop-blur-sm">
              <Icon name="clock" size={13} /> Recién actualizado
            </span>
          </div>
        </div>
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
  )
}
