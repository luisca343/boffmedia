import { usePathname } from "next/navigation";
import Link from "next/link";
import { HiChevronRight } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { GameConfig } from "@/config/gameTools";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

interface SidebarProps {
  gameConfig: GameConfig;
  isSidebarExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  gameConfig, 
  isSidebarExpanded,
  onMouseEnter,
  onMouseLeave
}) => {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  const [isAnimationComplete, setIsAnimationComplete] = useState(isSidebarExpanded);

  useEffect(() => {
    if (isSidebarExpanded) {
      const timer = setTimeout(() => {
        setIsAnimationComplete(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsAnimationComplete(false);
    }
  }, [isSidebarExpanded]);

  const handleMouseEnter = () => {
    onMouseEnter();
  };

  const handleMouseLeave = () => {
    onMouseLeave();
  };

  return (
    <div
      ref={sidebarRef}
      className="hidden md:block border-r border-surface-700/60 bg-surface-900 transition-all duration-300 ease-in-out fixed min-h-full z-30"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isSidebarExpanded ? '16rem' : '4rem',
        transition: 'width 300ms ease-in-out',
        willChange: 'width'
      }}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
      <div className={`p-2 space-y-6 ${isSidebarExpanded ? "" : "overflow-hidden"}`}>
        {gameConfig.categories.map((category) => (
          <div key={category.name}>
            {category.href ? (
              <Link
                href={category.href}
                className={cn(
                  "text-xs font-bold mb-2 uppercase tracking-[0.15em] px-2 block",
                  "transition-all duration-300 ease-in-out",
                  isSidebarExpanded
                    ? "opacity-100 text-surface-400 hover:text-primary-300"
                    : "opacity-100 text-surface-500 text-center"
                )}
              >
                {isAnimationComplete ? t(category.name) : "·"}
              </Link>
            ) : (
              <div className={cn(
                "text-xs font-bold mb-2 uppercase tracking-[0.15em] px-2",
                "transition-all duration-300 ease-in-out",
                isSidebarExpanded
                  ? "opacity-100 text-surface-500"
                  : "opacity-100 text-surface-600 text-center"
              )}>
                {isAnimationComplete ? t(category.name) : "·"}
              </div>
            )}
            <ul className="space-y-0.5">
              {category.tools.map((tool) => {
                const isActive = pathname === tool.href;
                const Icon = tool.icon;

                return (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      className={cn(
                        "flex items-center py-2 text-sm rounded-md group transition-all duration-150",
                        isSidebarExpanded ? "px-2" : "justify-center px-1",
                        isActive
                          ? "bg-primary-500/[0.12] text-primary-400 border-l-2 border-primary-400 pl-[6px]"
                          : "text-surface-300 hover:text-surface-50 hover:bg-surface-700/50"
                      )}
                      title={!isSidebarExpanded ? t(tool.name) : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-all duration-300 ease-in-out flex-shrink-0",
                          isSidebarExpanded ? "mr-2" : "mx-auto",
                          isActive ? "text-primary-400" : "text-surface-400 group-hover:text-surface-200"
                        )}
                        {...tool.iconProps}
                      />

                      <div className={cn(
                        "flex-1 whitespace-nowrap",
                        "transition-all duration-300 ease-in-out",
                        isSidebarExpanded
                          ? "opacity-100 max-w-full"
                          : "opacity-0 max-w-0 overflow-hidden"
                      )}>
                        {t(tool.name)}
                      </div>

                      {isActive && (
                        <HiChevronRight className={cn(
                          "h-4 w-4 text-primary-400 flex-shrink-0",
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
  );
};
