"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Icon, ICON_NAMES, toast, type IconName } from "@boffmedia/ui"
import { cn } from "@/lib/utils"

const ALL_ICON_NAMES = ICON_NAMES as IconName[]

export function IconGallery() {
  const t = useTranslations("styles.icons")
  const [query, setQuery] = React.useState("")
  const [size, setSize] = React.useState(32)
  const [copiedName, setCopiedName] = React.useState<IconName | null>(null)

  const filteredNames = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return ALL_ICON_NAMES
    return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(normalizedQuery))
  }, [query])

  const copyName = async (name: IconName) => {
    try {
      await navigator.clipboard.writeText(name)
      setCopiedName(name)
      toast({ tone: "ok", icon: "check", msg: t("copied", { name }) })
      window.setTimeout(() => setCopiedName((current) => (current === name ? null : current)), 1400)
    } catch {
      toast({ tone: "bad", icon: "alert", msg: t("copyFailed") })
    }
  }

  return (
    <main className="wrap pb-20">
      <header className="pt-9">
        <h1 className="font-display text-[clamp(2.75rem,10vw,5.5rem)]/[0.9] font-extrabold italic uppercase tracking-[-0.005em] text-txt">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-[68ch] text-[1rem] leading-[1.6] text-txt-muted">{t("description")}</p>
      </header>

      <section className="mt-9 border border-solid border-line bg-panel p-4 sm:p-5" aria-label={t("controlsLabel")}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-txt-muted">
              {t("searchLabel")}
            </span>
            <span className="flex items-center gap-2 border border-solid border-line-2 bg-base px-3 py-2 text-txt transition-[border-color] focus-within:border-accent">
              <Icon name="search" size={16} className="text-txt-dim" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchLabel")}
                className="min-w-0 flex-1 bg-transparent font-mono text-[0.8125rem] leading-none text-txt outline-none placeholder:text-txt-dim"
              />
              {query && (
                <button
                  type="button"
                  aria-label={t("clearSearch")}
                  onClick={() => setQuery("")}
                  className="grid h-6 w-6 place-items-center border-0 bg-transparent p-0 text-txt-dim transition-colors hover:text-txt"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </span>
          </label>

          <label className="grid gap-2">
            <span className="flex items-center justify-between font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-txt-muted">
              <span>{t("sizeLabel")}</span>
              <output className="text-accent">{t("sizeValue", { size })}</output>
            </span>
            <input
              type="range"
              min={18}
              max={64}
              step={2}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              aria-label={t("sizeLabel")}
              className="h-1 w-full cursor-pointer accent-[var(--accent)]"
            />
          </label>

          <div className="font-mono text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-txt-muted lg:pb-2">
            {t("count", { count: filteredNames.length })}
          </div>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">{t("catalogLabel")}</span>
          <h2 className="mt-2 font-display text-[clamp(1.875rem,6vw,3rem)]/[0.95] font-extrabold italic uppercase tracking-[-0.005em] text-txt">
            {t("catalogTitle")}
          </h2>
        </div>
        <code className="border border-solid border-line bg-panel-2 px-3 py-2 font-mono text-[0.75rem] text-txt-muted">
          import &#123; Icon &#125; from &quot;@boffmedia/ui&quot;
        </code>
      </div>

      <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-txt-dim">{t("copyHint")}</p>

      {filteredNames.length ? (
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9.25rem,1fr))] gap-3">
          {filteredNames.map((name) => {
            const copied = copiedName === name
            return (
              <button
                key={name}
                type="button"
                title={t("copyIcon", { name })}
                aria-label={t("copyIcon", { name })}
                onClick={() => void copyName(name)}
                className={cn(
                  "group relative flex min-h-[9.25rem] flex-col items-center justify-between border border-solid border-line bg-panel p-4 text-txt transition-[border-color,background,transform] duration-[140ms] hover:-translate-y-px hover:border-accent-line hover:bg-panel-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  copied && "border-accent bg-accent-soft",
                )}
              >
                <span className="grid min-h-[4.5rem] place-items-center text-accent transition-transform duration-[140ms] group-hover:scale-110">
                  <Icon name={name} size={size} />
                </span>
                <span className="flex w-full items-center justify-between gap-2 border-t border-dashed border-line pt-3 text-left">
                  <span className="min-w-0 truncate font-mono text-[0.6875rem] font-semibold tracking-[0.04em] text-txt-muted">{name}</span>
                  <Icon name={copied ? "check" : "copy"} size={13} className={copied ? "text-accent" : "text-txt-dim"} />
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-line-2 bg-panel p-10 text-center font-mono text-[0.8125rem] uppercase tracking-[0.1em] text-txt-muted">
          {t("empty")}
        </div>
      )}
    </main>
  )
}
