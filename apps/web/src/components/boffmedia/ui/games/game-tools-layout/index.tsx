"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { gameToolsConfig } from "@/config/gameTools"
import { FloatingSection } from "@/app/(boffmedia)/_components/layout/FloatingSection"
import { DesktopSidebar } from "./DesktopSidebar"
import { MobileHeader } from "./MobileHeader"
import { MobileSidebar } from "./MobileSidebar"

interface GameToolsLayoutProps {
  children: React.ReactNode
  gameSlug?: string
  noContainer?: boolean
  noMargin?: boolean
}

export default function GameToolsLayout({
  children,
  gameSlug = "",
  noContainer = false,
}: GameToolsLayoutProps) {
  const pathname = usePathname()
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  const effectiveGameSlug = gameSlug || pathname.split("/")[1]
  const gameConfig = gameToolsConfig[effectiveGameSlug]

  if (!gameConfig) {
    return <>{children}</>
  }

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex flex-col md:flex-row min-h-full">
      <DesktopSidebar gameConfig={gameConfig} isActive={isActive} />

      <MobileHeader gameConfig={gameConfig} onMenuClick={() => setMobileSheetOpen(true)} />

      <MobileSidebar
        gameConfig={gameConfig}
        isOpen={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        isActive={isActive}
      />

      <FloatingSection
        variant="default"
        showBackground
        showParticles={false}
        showBlobs={false}
        showGrid={false}
        overflow={noContainer ? "overflow-visible" : "overflow-hidden"}
        className="flex-1 min-w-0 w-full"
      >
        {noContainer ? (
          children
        ) : (
          <main className="mx-auto px-[var(--gutter,1.25rem)] py-6 md:pt-16" style={{ maxWidth: "var(--maxw, 1240px)" }}>
            {children}
          </main>
        )}
      </FloatingSection>
    </div>
  )
}
