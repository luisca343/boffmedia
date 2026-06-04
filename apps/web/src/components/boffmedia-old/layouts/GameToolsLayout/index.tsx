"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { gameToolsConfig } from "@/config/gameTools";
import { MobileSidebar } from "./MobileSidebar";
import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./DesktopSidebar";
import { FloatingSection } from "@/app/(boffmedia)/_components/layout/FloatingSection";

interface GameToolsLayoutProps {
  children: React.ReactNode;
  gameSlug?: string;
  noContainer?: boolean;
  noMargin?: boolean;
}

export default function GameToolsLayout({
  children,
  gameSlug = "",
  noContainer = false,
  noMargin = false,
}: GameToolsLayoutProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  const effectiveGameSlug = gameSlug || pathname.split("/")[1];
  
  const gameConfig = gameToolsConfig[effectiveGameSlug];

  if (!gameConfig) {
    return <>{children}</>;
  }

  const isSidebarExpanded = !sidebarCollapsed || isHovering;
  
  const mainContentMargin = noMargin ? "md:ml-16" : sidebarCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <div className="main min-h-full flex flex-col">
      <div className="flex flex-1">
        <Sidebar 
          gameConfig={gameConfig} 
          isSidebarExpanded={isSidebarExpanded}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />
        
        <MobileSidebar 
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          gameConfig={gameConfig}
        />
        
        <MobileHeader 
          gameConfig={gameConfig} 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        <FloatingSection className={`flex-1 bg-surface-900 overflow-auto w-full ${mainContentMargin} transition-all duration-300 ease-in-out md:pt-0`}>
          {noContainer ? children : (
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          )}
        </FloatingSection>
      </div>
    </div>
  );
}