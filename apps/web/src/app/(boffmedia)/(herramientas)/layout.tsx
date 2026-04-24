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

  const isVgcTracker = pathname.includes('/vgc/tracker');

  return (
    <GameToolsLayout gameSlug={gameSlug} noContainer={isVgcTracker} noMargin={isVgcTracker}>
      {children}
    </GameToolsLayout>
  );
}