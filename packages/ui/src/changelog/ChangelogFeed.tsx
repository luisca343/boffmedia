import * as React from "react"

import { cn } from "../cn"
import { SafeMarkdown } from "../markdown/SafeMarkdown"
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
  className?: string
}

const MARKDOWN_CLASS =
  "max-w-[68ch] text-[0.9375rem] leading-7 text-txt [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:bg-panel-2 [&_blockquote]:py-1 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-txt-muted [&_code]:border [&_code]:border-line-2 [&_code]:bg-panel-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:text-accent [&_h1]:mt-7 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:uppercase [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:uppercase [&_h3]:mt-5 [&_h3]:font-display [&_h3]:font-bold [&_h3]:uppercase [&_hr]:my-5 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-line [&_li]:ml-5 [&_li]:list-disc [&_ol]:my-3 [&_ol]:list-decimal [&_p]:mb-4 [&_p:last-child]:mb-0 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-line [&_pre]:bg-panel-2 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[0.8125rem] [&_pre]:leading-6 [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_strong]:text-txt [&_ul]:my-3"

export function ChangelogMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <SafeMarkdown className={cn("mt-6", MARKDOWN_CLASS, className)}>
      {children}
    </SafeMarkdown>
  )
}

function isExternalUrl(url: string): boolean {
  return !url.trim().startsWith("/") && !url.trim().startsWith("#")
}

function present(value: React.ReactNode): boolean {
  return value !== null && value !== undefined && value !== "" && value !== false
}

export function ChangelogFeed({ items, onOpenCta, className }: ChangelogFeedProps) {
  return (
    <div className={cn("mx-auto max-w-4xl divide-y divide-line", className)}>
      {items.map((item) => {
        const cta = item.cta
        const externalCta = cta ? isExternalUrl(cta.url) : false

        return (
          <article key={item.id} className="py-8 first:pt-0 last:pb-0">
            <header>
              <h2 className="font-display text-2xl font-extrabold uppercase leading-tight text-txt">
                {item.title}
              </h2>
              {(present(item.date) || present(item.version) || present(item.platform)) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
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

            {present(item.summary) && (
              <p className="mt-5 max-w-[68ch] text-[1rem] leading-relaxed text-txt-muted">
                {item.summary}
              </p>
            )}

            <ChangelogMarkdown>{item.body}</ChangelogMarkdown>

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
          </article>
        )
      })}
    </div>
  )
}
