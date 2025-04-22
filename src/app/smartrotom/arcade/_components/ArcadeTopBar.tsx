import { ChevronLeft, Joystick, Info, RefreshCw } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";
import { Button } from "@/components/ui/button";

interface ArcadeTopBarProps {
  title: string;
  onShowInstructions?: () => void;
  onReset?: () => void;
  showResetButton?: boolean;
}

export default function ArcadeTopBar({
  title,
  onShowInstructions,
  onReset,
  showResetButton = false
}: ArcadeTopBarProps) {
  return (
    <div className="relative z-10 bg-indigo-950 border-b-2 border-cyan-400 shadow-lg shadow-cyan-500/20 p-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <InternalLink
            href="/arcade"
            className="flex items-center text-cyan-300 hover:text-cyan-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Arcade</span>
          </InternalLink>
          
          <div className="h-4 border-r border-gray-700 mx-1"></div>
          
          <div className="flex items-center">
            <Joystick className="h-5 w-5 text-cyan-400 mr-1.5" />
            <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400 animate-text-shine">
              {title}
            </div>
          </div>
        </div>
        
        {(onShowInstructions || (showResetButton && onReset)) && (
          <div className="flex gap-1.5">
            {onShowInstructions && (
              <Button 
                onClick={onShowInstructions}
                className="bg-indigo-700 hover:bg-indigo-600 text-white h-7 px-2 py-0 text-xs"
                size="sm"
              >
                <Info className="h-3 w-3 mr-1" /> Ayuda
              </Button>
            )}
            
            {showResetButton && onReset && (
              <Button 
                onClick={onReset}
                className="bg-cyan-600 hover:bg-cyan-500 text-white h-7 px-2 py-0 text-xs"
                size="sm"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Reiniciar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}