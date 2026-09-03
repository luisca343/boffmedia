"use client"

import { useTranslations } from "next-intl"
import { HubSidebar } from "./HubSidebar"

export function SecondaryPageHeader({
  eyebrow,
  title,
  description,
  count,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  count?: number
  children?: React.ReactNode
}) {
  const t = useTranslations("pokedex")
  return (
    <div className="flex h-full">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end p-6 pb-4 border-b border-white/[0.05]">
          <div>
            <div className="font-pk-mono text-[0.65625rem] tracking-[0.12em] uppercase text-pk-surface-500 flex items-center gap-2 mb-1.5">
              <span className="w-[1.375rem] h-[1.375rem] grid place-items-center rounded-md bg-pk-primary-400/[0.12] text-pk-primary-300">
                <span className="w-3 h-3" />
              </span>
              {eyebrow}
            </div>
            <h1 className="font-pk-display font-bold text-[1.75rem] tracking-tight text-pk-surface-50 mb-1.5">{title}</h1>
            <p className="text-pk-surface-400 text-[0.84375rem] leading-relaxed max-w-[33.75rem]">{description}</p>
          </div>
          {count !== undefined && (
            <div className="flex flex-col gap-1.5 text-right text-xs text-pk-surface-400">
              <b className="font-pk-display font-bold text-xl text-pk-surface-50 tabular-nums">{count}</b>
              <span>{t("secondary_entries")}</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  )
}
