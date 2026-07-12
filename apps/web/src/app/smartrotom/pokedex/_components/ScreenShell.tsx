"use client"
import type { ReactNode } from "react"
import { HubSidebar } from "./HubSidebar"

// Shared secondary-page shell: fixed sidebar + internally-scrolling main.
export function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col gap-[22px] p-[24px_28px] overflow-auto">{children}</main>
    </div>
  )
}
