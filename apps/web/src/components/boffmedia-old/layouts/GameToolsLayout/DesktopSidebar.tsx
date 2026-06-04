import { usePathname } from "next/navigation";
import Link from "next/link";
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
  onMouseLeave,
}) => {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  const [isAnimationComplete, setIsAnimationComplete] = useState(isSidebarExpanded);

  useEffect(() => {
    if (isSidebarExpanded) {
      const timer = setTimeout(() => setIsAnimationComplete(true), 150);
      return () => clearTimeout(timer);
    } else {
      setIsAnimationComplete(false);
    }
  }, [isSidebarExpanded]);

  return (
    <div
      ref={sidebarRef}
      className="hidden md:flex flex-col fixed min-h-full z-30 transition-all duration-300 ease-in-out"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: isSidebarExpanded ? "16rem" : "4rem",
        willChange: "width",
        background: "linear-gradient(180deg, rgba(12,18,32,0.98) 0%, rgba(9,14,26,0.99) 100%)",
        borderRight: "1px solid rgba(71,85,105,0.4)",
        //boxShadow: "4px 0 24px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.02)",
      }}
    >
      {/* Top neon accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.7), transparent)",
        }}
      />

      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
        }}
      />

      {/* Left edge accent */}
      <div
        className="absolute left-0 inset-y-0 w-px pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(249,115,22,0.3) 30%, rgba(249,115,22,0.3) 70%, transparent)",
        }}
      />

      <div className={`relative z-10 p-2 pt-4 space-y-5 ${isSidebarExpanded ? "" : "overflow-hidden"}`}>
        {gameConfig.categories.map((category) => (
          <div key={category.name}>
            {/* Category label */}
            {category.href ? (
              <Link
                href={category.href}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-mono font-bold mb-2 uppercase tracking-[0.25em] px-2 transition-colors duration-200",
                  isSidebarExpanded
                    ? "opacity-100 text-surface-500 hover:text-primary-400"
                    : "opacity-100 justify-center"
                )}
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {isAnimationComplete ? (
                  <>
                    <span className="text-primary-600">//</span>
                    <span>{t(category.name)}</span>
                  </>
                ) : (
                  <span className="text-primary-600 text-xs">·</span>
                )}
              </Link>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-mono font-bold mb-2 uppercase tracking-[0.25em] px-2",
                  isSidebarExpanded ? "opacity-100 text-surface-600" : "opacity-100 justify-center"
                )}
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {isAnimationComplete ? (
                  <>
                    <span className="text-primary-700">//</span>
                    <span>{t(category.name)}</span>
                  </>
                ) : (
                  <span className="text-primary-700 text-xs">·</span>
                )}
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
                      title={!isSidebarExpanded ? t(tool.name) : undefined}
                      className={cn(
                        "relative flex items-center py-2 text-sm rounded-md group transition-all duration-200 overflow-hidden",
                        isSidebarExpanded ? "px-2" : "justify-center px-1"
                      )}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(90deg, rgba(249,115,22,0.12), rgba(249,115,22,0.04))",
                              borderLeft: "2px solid rgba(249,115,22,0.8)",
                              paddingLeft: isSidebarExpanded ? "6px" : undefined,
                              boxShadow: "inset 0 0 20px rgba(249,115,22,0.05)",
                            }
                          : undefined
                      }
                    >
                      {/* Hover background */}
                      {!isActive && (
                        <span
                          className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: "rgba(30,41,59,0.7)" }}
                        />
                      )}

                      {/* Active glow dot */}
                      {isActive && isSidebarExpanded && (
                        <span
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                          style={{
                            background: "rgba(249,115,22,0.9)",
                            boxShadow: "0 0 6px rgba(249,115,22,0.8)",
                          }}
                        />
                      )}

                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] flex-shrink-0 relative z-10 transition-all duration-200",
                          isSidebarExpanded ? "mr-2.5" : "mx-auto",
                          isActive
                            ? "text-primary-400"
                            : "text-surface-500 group-hover:text-surface-300"
                        )}
                        style={
                          isActive
                            ? { filter: "drop-shadow(0 0 6px rgba(249,115,22,0.5))" }
                            : undefined
                        }
                        {...tool.iconProps}
                      />

                      <div
                        className={cn(
                          "flex-1 whitespace-nowrap relative z-10 transition-all duration-300 ease-in-out text-sm",
                          isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0 overflow-hidden",
                          isActive
                            ? "text-primary-300 font-medium"
                            : "text-surface-400 group-hover:text-surface-100"
                        )}
                      >
                        {t(tool.name)}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(9,14,26,0.8), transparent)",
        }}
      />
    </div>
  );
};
