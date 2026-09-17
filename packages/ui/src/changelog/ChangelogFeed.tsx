import * as React from "react"

import { cn } from "../cn"
import { Markdown } from "../markdown/Markdown"
import { Badge } from "../primitives/badge"
import { Button } from "../primitives/button"
import { Icon } from "../primitives/icon"

export interface ChangelogDisplayCta {
  label: React.ReactNode
  url: string
}

export interface ChangelogDisplayItem {
  id: number | string
  title: React.ReactNode
  date?: React.ReactNode
  version?: React.ReactNode
  platform?: React.ReactNode
  summary?: React.ReactNode
  body: string
  cta?: ChangelogDisplayCta
}

export interface ChangelogFeedProps {
  items: readonly ChangelogDisplayItem[]
  /** Optional host navigation hook. When supplied, the host owns the CTA open. */
  onOpenCta?: (url: string) => void
  /** Stack the release panel for narrow host surfaces such as an admin preview. */
  compact?: boolean
  className?: string
}

export function ChangelogMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <Markdown className={cn("mt-6", className)}>
      {children}
    </Markdown>
  )
}

function isExternalUrl(url: string): boolean {
  return !url.trim().startsWith("/") && !url.trim().startsWith("#")
}

function present(value: React.ReactNode): boolean {
  return value !== null && value !== undefined && value !== "" && value !== false
}

export function ChangelogFeed({ items, onOpenCta, compact = false, className }: ChangelogFeedProps) {
  return (
    <div className={cn("w-full space-y-5", className)}>
      {items.map((item) => {
        const cta = item.cta
        const externalCta = cta ? isExternalUrl(cta.url) : false

        return (
          <article
            key={item.id}
            className={cn(
              "grid border border-solid border-line border-l-4 border-l-accent bg-panel cut-corner cut-corner-edge [--cut-line:var(--line)]",
              compact
                ? "grid-cols-1 gap-4 px-4 py-5"
                : "gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1.7fr)] lg:gap-10 lg:px-8 lg:py-7",
            )}
          >
            <header className="min-w-0">
              <h2 className="font-display text-[clamp(1.5rem,2.5vw,2.25rem)] font-extrabold uppercase leading-[0.98] text-txt">
                {item.title}
              </h2>
              {present(item.summary) && (
                <p className="mt-4 max-w-[42ch] text-[1rem] leading-relaxed text-txt-muted">
                  {item.summary}
                </p>
              )}
              {(present(item.date) || present(item.version) || present(item.platform)) && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {present(item.date) && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-txt-dim">
                      <Icon name="calendar" size={14} />
                      {item.date}
                    </span>
                  )}
                  {present(item.version) && <Badge tone="new">{item.version}</Badge>}
                  {present(item.platform) && <Badge tone="default">{item.platform}</Badge>}
                </div>
              )}
            </header>

            <div className={cn(
              "min-w-0",
              !compact && "lg:border-l lg:border-solid lg:border-line lg:pl-10",
            )}>
              <ChangelogMarkdown className="mt-0">{item.body}</ChangelogMarkdown>

              {cta && present(cta.label) && (
                <Button
                  href={cta.url}
                  onClick={
                    onOpenCta
                      ? (event) => {
                          event.preventDefault()
                          onOpenCta(cta.url)
                        }
                      : undefined
                  }
                  size="sm"
                  variant="pri"
                  iconRight={externalCta ? "external" : "arrow"}
                  target={externalCta && !onOpenCta ? "_blank" : undefined}
                  rel={externalCta && !onOpenCta ? "noopener noreferrer" : undefined}
                  className="mt-6"
                >
                  {cta.label}
                </Button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
