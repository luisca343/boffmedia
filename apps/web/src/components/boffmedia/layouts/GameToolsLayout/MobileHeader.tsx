import Image from "next/image";
import { Button } from "@/components/ui/primitives/button";
import { GiHamburgerMenu, GiGamepad } from "react-icons/gi";
import { GameConfig } from "@/config/gameTools";
import { useTranslations } from "next-intl";

interface MobileHeaderProps {
  gameConfig: GameConfig;
  onMenuClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ gameConfig, onMenuClick }) => {
  // Use the useTranslations hook to access translations
  const t = useTranslations();
  
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 bg-surface-900/95 backdrop-blur-md border-b border-surface-700/60 z-10">
      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
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
        onClick={onMenuClick}
        className="text-surface-200 hover:text-surface-50"
      >
        <GiHamburgerMenu className="h-5 w-5" />
      </Button>
    </div>
  );
};