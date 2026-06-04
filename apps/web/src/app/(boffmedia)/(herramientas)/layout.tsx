"use client";

import { usePathname } from "next/navigation";
import GameToolsLayout from "@/components/boffmedia/ui/game-tools-layout";

export default function Layout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const gameSlug = pathname.split("/")[1];

  const isVgcTracker = pathname.includes('/vgc/tracker') && pathname.split("/").length >= 6;
  const isVgcMeta    = pathname.includes('/vgc/meta');
  const isDamageCalc  = pathname.includes('/vgc/damage-calculator');
  const fullscreen   = isVgcTracker || isVgcMeta || isDamageCalc;

  return (
    <GameToolsLayout gameSlug={gameSlug} noContainer={fullscreen} noMargin={fullscreen}>
      {children}
    </GameToolsLayout>
  );
}