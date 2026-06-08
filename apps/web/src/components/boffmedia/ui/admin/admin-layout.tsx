"use client"

import { cn } from "@/lib/utils"
import { BarChart2, type LucideIcon } from "lucide-react"
import { ToastContainer } from "react-toastify"

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface AdminLayoutProps {
  nav: NavGroup[]
  section: string
  onNavigate: (id: string) => void
  children: React.ReactNode
  loading?: boolean
}

export function AdminLayout({ nav, section, onNavigate, children, loading }: AdminLayoutProps) {
  const allItems = nav.flatMap((g) => g.items)
  const activeItem = allItems.find((i) => i.id === section)
  const ActiveIcon = activeItem?.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--orange-500)] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] py-5 px-3 gap-0.5">
        <div className="px-3 mb-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[color-mix(in_srgb,var(--orange-500)_15%,transparent)] border border-[color-mix(in_srgb,var(--orange-500)_25%,transparent)] flex items-center justify-center shrink-0">
            <BarChart2 className="w-3.5 h-3.5 text-[var(--orange-500)]" />
          </div>
          <span className="text-sm font-bold text-[var(--text)] tracking-tight">Admin</span>
        </div>

        {nav.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
              {group.label}
            </p>
            {group.items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  section === id
                    ? "bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] text-[var(--orange-500)] border border-[color-mix(in_srgb,var(--orange-500)_28%,transparent)]"
                    : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] hover:text-[var(--text)]"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", section === id ? "text-[var(--orange-500)]" : "text-[var(--text-dim)]")} />
                {label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] backdrop-blur-[8px] border-b border-[var(--border)] px-4 py-3">
          {/* Mobile nav */}
          <div className="md:hidden overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--surface-3)] scrollbar-track-transparent">
            <div className="inline-flex min-w-max items-center gap-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] p-1">
              {allItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                    section === id
                      ? "bg-[color-mix(in_srgb,var(--orange-500)_20%,transparent)] text-[var(--orange-500)] border border-[color-mix(in_srgb,var(--orange-500)_20%,transparent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop title */}
          <div className="hidden md:flex items-center gap-2">
            {ActiveIcon && <ActiveIcon className="w-4 h-4 text-[var(--orange-500)] shrink-0" />}
            <span className="text-sm font-semibold text-[var(--text)]">{activeItem?.label ?? "Admin"}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  )
}
