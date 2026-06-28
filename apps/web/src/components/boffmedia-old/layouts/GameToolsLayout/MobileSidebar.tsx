import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { GiGamepad } from "react-icons/gi";
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
  gameConfig,
}) => {
  const pathname = usePathname();
  const t = useTranslations();

  if (!mobileSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 left-0 w-full max-w-xs flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(12,18,32,0.99) 0%, rgba(9,14,26,1) 100%)",
          borderRight: "1px solid rgba(71,85,105,0.4)",
          boxShadow: "8px 0 32px rgba(0,0,0,0.6), inset -1px 0 0 rgba(255,255,255,0.02)",
        }}
      >
        {/* Top neon bar */}
        <div
          className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(249,115,22,0.8) 0%, rgba(249,115,22,0.3) 60%, transparent 100%)",
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

        {/* Right edge accent */}
        <div
          className="absolute right-0 inset-y-0 w-px pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(249,115,22,0.5), rgba(249,115,22,0.15) 40%, transparent)",
          }}
        />

        {/* Header */}
        <div
          className="relative z-10 flex items-center justify-between px-4 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}
        >
          {/* Corner bracket top-left */}
          <div
            className="absolute top-3 left-3 w-3 h-3 border-t border-l pointer-events-none"
            style={{ borderColor: "rgba(249,115,22,0.4)" }}
          />

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 border"
              style={{
                borderColor: "rgba(249,115,22,0.35)",
                background: "rgba(30,41,59,0.8)",
                boxShadow: "0 0 12px rgba(249,115,22,0.1)",
              }}
            >
              {gameConfig.icon ? (
                <Image
                  src={gameConfig.icon}
                  alt={t(gameConfig.name)}
                  width={28}
                  height={28}
                  className="object-contain"
                />
              ) : (
                <GiGamepad className="h-5 w-5 text-primary-hover" />
              )}
            </div>

            <div>
              <p
                className="font-black text-sm text-ink leading-none tracking-wide"
                style={{
                  fontFamily: "Orbitron, sans-serif",
                  textShadow: "0 0 12px rgba(249,115,22,0.25)",
                }}
              >
                {t(gameConfig.name)}
              </p>
              <p
                className="text-[9px] font-mono text-primary-active tracking-[0.35em] uppercase mt-0.5"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                // MENÚ
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200"
            style={{
              border: "1px solid rgba(71,85,105,0.5)",
              background: "rgba(30,41,59,0.6)",
              color: "rgb(148,163,184)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.45)";
              (e.currentTarget as HTMLElement).style.color = "rgb(251,146,60)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(71,85,105,0.5)";
              (e.currentTarget as HTMLElement).style.color = "rgb(148,163,184)";
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {gameConfig.categories.map((category) => (
            <div key={category.name}>
              {/* Category label */}
              {category.href ? (
                <Link
                  href={category.href}
                  className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-ink-muted hover:text-primary-hover mb-2 uppercase tracking-[0.25em] px-2 transition-colors duration-200"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className="text-primary-active">//</span>
                  {t(category.name)}
                </Link>
              ) : (
                <div
                  className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-ink-dim mb-2 uppercase tracking-[0.25em] px-2"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  <span className="text-primary-active">//</span>
                  {t(category.name)}
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
                          "relative flex items-center px-2 py-2.5 text-sm rounded-md group transition-all duration-200 overflow-hidden"
                        )}
                        style={
                          isActive
                            ? {
                                background:
                                  "linear-gradient(90deg, rgba(249,115,22,0.12), rgba(249,115,22,0.04))",
                                borderLeft: "2px solid rgba(249,115,22,0.8)",
                                paddingLeft: "6px",
                                boxShadow: "inset 0 0 20px rgba(249,115,22,0.05)",
                              }
                            : undefined
                        }
                        onClick={() => setMobileSidebarOpen(false)}
                      >
                        {/* Hover bg */}
                        {!isActive && (
                          <span
                            className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ background: "rgba(30,41,59,0.7)" }}
                          />
                        )}

                        <Icon
                          className={cn(
                            "mr-3 h-[18px] w-[18px] flex-shrink-0 relative z-10 transition-colors duration-200",
                            isActive
                              ? "text-primary-hover"
                              : "text-ink-muted group-hover:text-ink"
                          )}
                          style={
                            isActive
                              ? { filter: "drop-shadow(0 0 6px rgba(249,115,22,0.5))" }
                              : undefined
                          }
                          {...tool.iconProps}
                        />

                        <span
                          className={cn(
                            "relative z-10 flex-1 transition-colors duration-200",
                            isActive
                              ? "text-primary-hover font-medium"
                              : "text-ink-muted group-hover:text-ink"
                          )}
                        >
                          {t(tool.name)}
                        </span>

                        {/* Active indicator */}
                        {isActive && (
                          <span
                            className="relative z-10 w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              background: "rgba(249,115,22,0.9)",
                              boxShadow: "0 0 6px rgba(249,115,22,0.7)",
                            }}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(9,14,26,0.9), transparent)",
          }}
        />
      </div>
    </div>
  );
};
