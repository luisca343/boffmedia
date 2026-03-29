import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/primitives/button";
import { RxCross1 } from "react-icons/rx";
import { GiGamepad } from "react-icons/gi";
import { HiChevronRight } from "react-icons/hi";
import { GameConfig } from "@/config/gameTools";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface MobileSidebarProps {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  gameConfig: GameConfig;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  mobileSidebarOpen, 
  setMobileSidebarOpen, 
  gameConfig 
}) => {
  const pathname = usePathname();
  // Use the useTranslations hook to access translations
  const t = useTranslations();

  if (!mobileSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setMobileSidebarOpen(false)}
      />
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-surface-900 border-r border-surface-700/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {gameConfig.icon ? (
              <Image
                src={gameConfig.icon}
                alt={t(gameConfig.name)}
                width={32}
                height={32}
                className="mr-2 rounded"
              />
            ) : (
              <GiGamepad className="mr-2 h-6 w-6 text-primary-400" />
            )}
            <span className="font-bold text-lg text-surface-50">{t(gameConfig.name)}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileSidebarOpen(false)}
            className="text-surface-200 hover:text-surface-50"
          >
            <RxCross1 className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-6 mt-6">
          {gameConfig.categories.map((category) => (
            <div key={category.name}>
              {category.href ? (
                <Link
                  href={category.href}
                  className="block text-xs font-bold text-surface-500 mb-2 uppercase tracking-[0.15em] px-2 hover:text-primary-300 transition-colors"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  {t(category.name)}
                </Link>
              ) : (
                <h3 className="text-xs font-bold text-surface-500 mb-2 uppercase tracking-[0.15em] px-2">
                  {t(category.name)}
                </h3>
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
                          "flex items-center px-2 py-2 text-sm rounded-md group transition-all duration-150",
                          isActive
                            ? "bg-primary-500/[0.12] text-primary-400 border-l-2 border-primary-400 pl-[6px]"
                            : "text-surface-300 hover:text-surface-50 hover:bg-surface-700/50"
                        )}
                        onClick={() => setMobileSidebarOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "mr-2 h-5 w-5 flex-shrink-0",
                            isActive ? "text-primary-400" : "text-surface-400 group-hover:text-surface-200"
                          )}
                          {...tool.iconProps}
                        />
                        {t(tool.name)}
                        {isActive && <HiChevronRight className="ml-auto h-4 w-4 text-primary-400" />}
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
  );
};