"use client"

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
  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end p-6 pb-4 border-b border-white/[0.05]">
          <div>
            <div className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500 flex items-center gap-2 mb-1.5">
              <span className="w-[22px] h-[22px] grid place-items-center rounded-md bg-primary-400/[0.12] text-primary-300">
                <span className="w-3 h-3" />
              </span>
              {eyebrow}
            </div>
            <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50 mb-1.5">{title}</h1>
            <p className="text-surface-400 text-[13.5px] leading-relaxed max-w-[540px]">{description}</p>
          </div>
          {count !== undefined && (
            <div className="flex flex-col gap-1.5 text-right text-xs text-surface-400">
              <b className="font-orbitron font-bold text-xl text-surface-50 tabular-nums">{count}</b>
              <span>entradas</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  )
}
