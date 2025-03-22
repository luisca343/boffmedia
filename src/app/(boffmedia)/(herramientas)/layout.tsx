"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Home, 
  Menu, 
  X, 
  ChevronRight, 
  ArrowLeft, 
  Search,
  SwordIcon,
  BarChart,
  Diamond, 
  Map,
  ShieldAlert,
  Zap,
  Users,
  Gamepad2,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// This would typically come from a configuration or API
const gameToolsConfig = {
  "pokemon": {
    name: "Pokémon",
    icon: "/img/games/pokemon-icon.webp",
    color: "from-yellow-400 to-red-500",
    bg: "bg-red-900",
    categories: [
      {
        tools: [
          { name: "TCGPocket", href: "/pokemon/tcgpocket", icon: Diamond },
        ]
      }, 
      {
        name: "Pokémon Mundo Misterioso",
        tools: [
           { name: "Sky Generator", href: "/pokemon/pmdsky", icon: Zap },
        ]
      }
    ]
  }
};

export default function GameToolsLayout({ 
  children, 
  gameSlug 
}: { 
  children: React.ReactNode;
  gameSlug: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Set to true by default
  const [isHovering, setIsHovering] = useState(false);


  if (!gameSlug) gameSlug = pathname.split("/")[1];

  const gameConfig = gameToolsConfig[gameSlug as keyof typeof gameToolsConfig];
  
  if(gameSlug === "herramientas") {
    return <>
      {children}
    </>
  }
  
  if (!gameConfig) {
    return <div>Game not found</div>;
  }

  // Determine if sidebar should be expanded based on collapsed state and hover
  const isSidebarExpanded = !sidebarCollapsed || isHovering;
  
  // Calculate sidebar width based on expanded state
  const sidebarWidth = isSidebarExpanded ? "w-64" : "w-16";
  
  // Calculate main content margin based on sidebar state
  const mainContentMargin = sidebarCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <div className="main min-h-full flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar for desktop - Collapsible */}
        <div 
          className={`hidden md:block ${sidebarWidth} border-r border-surface-700 bg-surface-800 transition-all duration-300 ease-in-out fixed min-h-full z-10`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className={`p-2 space-y-6 ${isSidebarExpanded ? "" : "overflow-hidden"}`}>
            {gameConfig.categories.map((category) => (
              <div key={category.name}>
                <div className={cn(
                  "text-sm font-medium mb-2 uppercase tracking-wider px-2",
                  "transition-all duration-300 ease-in-out",
                  isSidebarExpanded 
                    ? "opacity-100 h-auto text-surface-400" 
                    : "opacity-0 h-0 overflow-hidden"
                )}>
                  {category.name}
                </div>
                <ul className="space-y-1">
                  {category.tools.map((tool) => {
                    const isActive = pathname === tool.href;
                    const Icon = tool.icon;
                    
                    return (
                      <li key={tool.href}>
                        <Link 
                          href={tool.href}
                          className={cn(
                            "flex items-center py-2 text-sm rounded-md group",
                            isSidebarExpanded ? "px-2" : "justify-center px-1",
                            isActive 
                              ? "bg-primary-500/10 text-primary-400" 
                              : "text-surface-300 hover:text-surface-50 hover:bg-surface-700"
                          )}
                          title={!isSidebarExpanded ? tool.name : undefined}
                        >
                          <Icon className={cn(
                            "h-5 w-5 transition-all duration-300 ease-in-out",
                            isSidebarExpanded ? "mr-2" : "mx-auto",
                            isActive ? "text-primary-400" : "text-surface-400 group-hover:text-surface-300"
                          )} />
                          
                          <div className={cn(
                            "flex-1 whitespace-nowrap",
                            "transition-all duration-300 ease-in-out",
                            isSidebarExpanded 
                              ? "opacity-100 max-w-full" 
                              : "opacity-0 max-w-0 overflow-hidden"
                          )}>
                            {tool.name}
                          </div>
                          
                          {isActive && (
                            <ChevronRight className={cn(
                              "h-4 w-4 text-primary-400",
                              "transition-all duration-300 ease-in-out",
                              isSidebarExpanded 
                                ? "opacity-100 max-w-full" 
                                : "opacity-0 max-w-0 overflow-hidden"
                            )} />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-surface-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {gameConfig.icon ? (
                    <Image
                      src={gameConfig.icon}
                      alt={gameConfig.name}
                      width={32}
                      height={32}
                      className="mr-2 rounded"
                    />
                  ) : (
                    <Gamepad2 className="mr-2 h-6 w-6 text-primary-400" />
                  )}
                  <span className="font-bold text-lg text-surface-50">{gameConfig.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-surface-200 hover:text-surface-50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-6 mt-6">
                {gameConfig.categories.map((category) => (
                  <div key={category.name}>
                    <h3 className="text-sm font-medium text-surface-400 mb-2 uppercase tracking-wider px-2">
                      {category.name}
                    </h3>
                    <ul className="space-y-1">
                      {category.tools.map((tool) => {
                        const isActive = pathname === tool.href;
                        const Icon = tool.icon;
                        
                        return (
                          <li key={tool.href}>
                            <Link 
                              href={tool.href}
                              className={cn(
                                "flex items-center px-2 py-2 text-sm rounded-md group",
                                isActive 
                                  ? "bg-primary-500/10 text-primary-400" 
                                  : "text-surface-300 hover:text-surface-50 hover:bg-surface-700"
                              )}
                              onClick={() => setMobileSidebarOpen(false)}
                            >
                              <Icon className={cn(
                                "mr-2 h-5 w-5",
                                isActive ? "text-primary-400" : "text-surface-400 group-hover:text-surface-300"
                              )} />
                              {tool.name}
                              {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary-400" />}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile header with menu button */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 bg-surface-800 border-b border-surface-700 z-10">
          <div className="flex items-center">
            {gameConfig.icon ? (
              <Image
                src={gameConfig.icon}
                alt={gameConfig.name}
                width={32}
                height={32}
                className="mr-2 rounded"
              />
            ) : (
              <Gamepad2 className="mr-2 h-6 w-6 text-primary-400" />
            )}
            <span className="font-bold text-lg text-surface-50">{gameConfig.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileSidebarOpen(true)}
            className="text-surface-200 hover:text-surface-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Main content area */}
        <div className={`flex-1 bg-surface-900 overflow-auto w-full ${mainContentMargin} transition-all duration-300 ease-in-out md:pt-0 pt-16`}>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}