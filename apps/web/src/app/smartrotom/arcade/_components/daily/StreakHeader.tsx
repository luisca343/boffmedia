import { Calendar, Loader2 } from "lucide-react";

interface StreakHeaderProps {
  currentBanner: string | null | undefined;
  currentDay: number;
  totalDays: number;
  isLoading: boolean;
}

export default function StreakHeader({ 
  currentBanner, 
  currentDay, 
  totalDays, 
  isLoading 
}: StreakHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-secondary-900 to-accent-900 px-5 py-3 flex items-center justify-between flex-wrap">
      <div className="flex items-center">
        <Calendar className="h-5 w-5 text-secondary-300 mr-2" />
        <h2 className="text-lg font-bold text-white">Progreso de Racha Diaria</h2>
      </div>
      <div className="flex items-center">
        {/* Banner name display */}
        {currentBanner && (
          <div className="mr-4 px-2 py-1 bg-indigo-900/50 rounded-md text-xs text-cyan-200 border border-indigo-500/30">
            {currentBanner}
          </div>
        )}
        <div className="text-sm text-cyan-300 font-mono">
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" /> Cargando...
            </span>
          ) : (
            `Día ${currentDay}/${totalDays}`
          )}
        </div>
      </div>
    </div>
  );
}