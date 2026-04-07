import { AlertCircle, Clock } from "lucide-react";

interface StreakNotificationsProps {
  bannerChanged: boolean;
  claimed: boolean;
  error: string | null;
  timeUntilReset: string;
}

export default function StreakNotifications({
  bannerChanged,
  error,
}: StreakNotificationsProps) {
  return (
    <>
      {/* Banner change notification */}
      {bannerChanged && (
        <div className="bg-secondary-900/30 border-b border-secondary-500/30 p-2 flex items-center">
          <AlertCircle className="h-4 w-4 text-secondary-400 mr-2" />
          <span className="text-sm text-secondary-300">
            ¡Nueva temporada de recompensas disponible! Tu progreso ha sido reiniciado para la nueva serie de recompensas.
          </span>
        </div>
      )}
      
      {/* 
      <div className="bg-indigo-900/20 border-b border-indigo-500/20 p-2 flex items-center">
        <Clock className="h-4 w-4 text-indigo-400 mr-2" />
        <span className="text-xs text-indigo-300">
          Las recompensas se reinician a las 6:00 AM. Próximo reinicio en {timeUntilReset}
        </span>
      </div>
      
      {claimed && (
        <div className="bg-amber-900/20 border-b border-amber-500/30 p-2 flex items-center">
          <AlertCircle className="h-4 w-4 text-amber-400 mr-2" />
          <span className="text-xs text-amber-300">
            Ya has reclamado tu recompensa hoy. Próxima recompensa disponible mañana a las 6:00 AM.
          </span>
        </div>
      )}
      */}

      {error && (
        <div className="bg-red-900/30 border-b border-red-500/30 p-2 flex items-center">
          <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}
    </>
  );
}