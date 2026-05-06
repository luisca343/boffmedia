"use client";

import { usePathname } from "next/navigation";
import GameToolsLayout from "@/components/boffmedia/layouts/GameToolsLayout";

export default function Layout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const gameSlug = pathname.split("/")[1];

  const isVgcTracker = pathname.includes('/vgc/tracker') && pathname.split("/").length >= 6;
  const isVgcMeta    = pathname.includes('/vgc/meta');
  const fullscreen   = isVgcTracker || isVgcMeta;

  return (
    <GameToolsLayout gameSlug={gameSlug} noContainer={fullscreen} noMargin={fullscreen}>
      {children}
    </GameToolsLayout>
  );
}