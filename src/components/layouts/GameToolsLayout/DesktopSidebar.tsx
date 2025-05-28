import { usePathname } from "next/navigation";
import Link from "next/link";
import { HiChevronRight } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { GameConfig } from "@/config/gameTools";
import { useTranslations } from "next-intl";

interface SidebarProps {
  gameConfig: GameConfig;
  isSidebarExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  gameConfig, 
  isSidebarExpanded,
  onMouseEnter,
  onMouseLeave
}) => {
  const pathname = usePathname();
  const sidebarWidth = isSidebarExpanded ? "w-64" : "w-16";
  // Use the useTranslations hook to access translations
  const t = useTranslations();

  return (
    <div 
      className={`hidden md:block ${sidebarWidth} border-r border-surface-700 bg-surface-800 transition-all duration-300 ease-in-out fixed min-h-full z-10`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`p-2 space-y-6 ${isSidebarExpanded ? "" : "overflow-hidden"}`}>
        {gameConfig.categories.map((category) => (
          <div key={category.name}>
            {category.href ? (
              <Link
                href={category.href}
                className={cn(
                  "text-sm font-medium mb-2 uppercase tracking-wider px-2 block",
                  "transition-all duration-300 ease-in-out",
                  isSidebarExpanded 
                    ? "opacity-100 h-auto text-surface-100 hover:text-primary-200" 
                    : "opacity-0 h-0 overflow-hidden"
                )}
              >
                {t(category.name)}
              </Link>
            ) : (
              <div className={cn(
                "text-sm font-medium mb-2 uppercase tracking-wider px-2",
                "transition-all duration-300 ease-in-out",
                isSidebarExpanded 
                  ? "opacity-100 h-auto text-surface-400" 
                  : "opacity-0 h-0 overflow-hidden"
              )}>
                {t(category.name)}
              </div>
            )}
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
                      title={!isSidebarExpanded ? t(tool.name) : undefined}
                    >
                      <Icon 
                        className={cn(
                          "h-5 w-5 transition-all duration-300 ease-in-out",
                          isSidebarExpanded ? "mr-2" : "mx-auto",
                          isActive ? "text-primary-400" : "text-surface-400 group-hover:text-surface-300"
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
  );
};

export default Sidebar;