"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { gameToolsConfig } from "@/config/gameTools";
import MobileSidebar from "./MobileSidebar";
import Sidebar from "./DesktopSidebar";
import MobileHeader from "./MobileHeader";

interface GameToolsLayoutProps {
  children: React.ReactNode;
  gameSlug?: string;
}

export default function GameToolsLayout({ 
  children, 
  gameSlug = "" 
}: GameToolsLayoutProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  // Determine game slug from pathname if not provided
  const effectiveGameSlug = gameSlug || pathname.split("/")[1];
  
  // Get game config from the configuration
  const gameConfig = gameToolsConfig[effectiveGameSlug];

  // If no game config is found, just render children
  if (!gameConfig) {
    return <>{children}</>;
  }

  // Determine if sidebar should be expanded based on collapsed state and hover
  const isSidebarExpanded = !sidebarCollapsed || isHovering;
  
  // Calculate main content margin based on sidebar state
  const mainContentMargin = sidebarCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <div className="main min-h-full flex flex-col">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar 
          gameConfig={gameConfig} 
          isSidebarExpanded={isSidebarExpanded}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />
        
        {/* Mobile Sidebar */}
        <MobileSidebar 
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          gameConfig={gameConfig}
        />
        
        {/* Mobile Header */}
        <MobileHeader 
          gameConfig={gameConfig} 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        {/* Main Content */}
        <div className={`flex-1 bg-surface-900 overflow-auto w-full ${mainContentMargin} transition-all duration-300 ease-in-out md:pt-0 pt-16`}>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}