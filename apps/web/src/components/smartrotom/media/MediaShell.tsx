"use client"

import { useState, type ReactNode } from "react"
import { MediaAppProvider, type MediaAppId } from "./_theme"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

/**
 * Shared media shell: roots the theme, renders the topbar + sidebar chrome, and
 * scrolls its main area internally (SmartRotom's AppWrapper is fixed-height with
 * a `pt-12` Rotom navbar — window-scroll would clip). Used by both app layouts.
 */
export function MediaShell({ app, children }: { app: MediaAppId; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <MediaAppProvider app={app} className="flex h-[calc(100dvh_-_3rem)] min-h-0 flex-col overflow-hidden">
      <Topbar
        onToggleSidebar={() => {
          setCollapsed((c) => !c)
          setMobileOpen((o) => !o)
        }}
      />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} className="max-lg:hidden" />

        {/* mobile drawer */}
        {mobileOpen && (
          <div className="absolute inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <Sidebar collapsed={false} className="absolute inset-y-0 left-0 animate-mw-fade-in" />
          </div>
        )}

        <main className="mw-scroll min-w-0 flex-1 overflow-y-auto animate-mw-fade-in">{children}</main>
      </div>
    </MediaAppProvider>
  )
}
