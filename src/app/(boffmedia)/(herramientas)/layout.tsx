"use client";

import { usePathname } from "next/navigation";
import GameToolsLayout from "@/components/layouts/GameToolsLayout";

export default function Layout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const gameSlug = pathname.split("/")[1];

  return (
    <GameToolsLayout gameSlug={gameSlug}>
      {children}
    </GameToolsLayout>
  );
}