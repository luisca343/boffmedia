import Image from "next/image";
import { GiGamepad } from "react-icons/gi";
import { Menu } from "lucide-react";
import { GameConfig } from "@/config/gameTools";
import { useTranslations } from "next-intl";

interface MobileHeaderProps {
  gameConfig: GameConfig;
  onMenuClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ gameConfig, onMenuClick }) => {
  const t = useTranslations();

  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-10"
      style={{
        background: "linear-gradient(180deg, rgba(9,14,26,0.98) 0%, rgba(12,18,32,0.97) 100%)",
        borderBottom: "1px solid rgba(71,85,105,0.4)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.02)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
        }}
      />

      {/* Bottom neon line */}
      <div
        className="absolute inset-x-0 bottom-0 h-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent)",
        }}
      />

      {/* Corner brackets */}
      <div
        className="absolute top-2 left-2 w-3 h-3 border-t border-l pointer-events-none"
        style={{ borderColor: "rgba(249,115,22,0.35)" }}
      />
      <div
        className="absolute top-2 right-2 w-3 h-3 border-t border-r pointer-events-none"
        style={{ borderColor: "rgba(249,115,22,0.35)" }}
      />

      {/* Left: icon + game name */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 border"
          style={{
            borderColor: "rgba(249,115,22,0.3)",
            background: "rgba(30,41,59,0.8)",
          }}
        >
          {gameConfig.icon ? (
            <Image
              src={gameConfig.icon}
              alt={t(gameConfig.name)}
              width={24}
              height={24}
              className="object-contain"
            />
          ) : (
            <GiGamepad className="h-4 w-4 text-primary-hover" />
          )}
        </div>

        <span
          className="font-black text-sm text-ink tracking-wide leading-none"
          style={{
            fontFamily: "Orbitron, sans-serif",
            textShadow: "0 0 12px rgba(249,115,22,0.25)",
          }}
        >
          {t(gameConfig.name)}
        </span>
      </div>

      {/* Right: menu button */}
      <button
        onClick={onMenuClick}
        className="relative z-10 flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200"
        style={{
          border: "1px solid rgba(71,85,105,0.5)",
          background: "rgba(30,41,59,0.6)",
          color: "rgb(148,163,184)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.45)";
          (e.currentTarget as HTMLElement).style.color = "rgb(251,146,60)";
          (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(71,85,105,0.5)";
          (e.currentTarget as HTMLElement).style.color = "rgb(148,163,184)";
          (e.currentTarget as HTMLElement).style.background = "rgba(30,41,59,0.6)";
        }}
      >
        <Menu className="h-4 w-4" />
      </button>
    </div>
  );
};
