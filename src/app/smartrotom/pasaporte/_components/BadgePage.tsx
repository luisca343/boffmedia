import type { SmartRotomAchievement } from "../_types/Achievement"
import { parseDate } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Game } from "@/app/battlesim/replay/_components/Game"
import ActiveTeam from "./ActiveTeam"

interface BadgePageProps {
  achievement: SmartRotomAchievement
  team: any
}

export function BadgePage({ achievement, team }: BadgePageProps) {
  return (
    <div className="flex flex-col h-full font-vinque">
      <div className="flex justify-between items-end border-b border-black/20 pb-4 mt-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 2xl:w-16 2xl:h-16 relative">
              <img
                src={`https://api.boffmedia.es/smartrotom/img/logros/${achievement.icon}.webp`}
                alt={achievement.name}
                className="relative z-10 w-full h-full object-contain"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold self-end tracking-tight">{achievement.name}</h2>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">Obtenida: {parseDate(achievement.completedAt)}</span>
          {achievement.replay && (
            <Popover>
              <PopoverTrigger className="text-sm hover:text-primary transition-colors">Ver Repetición</PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Game battleName={achievement.id} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="relative z-10">
          <ActiveTeam team={team} className="h-[95%]" />
        </div>
      </div>
    </div>
  )
}

