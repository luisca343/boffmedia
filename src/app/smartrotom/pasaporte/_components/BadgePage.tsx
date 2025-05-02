import type { SmartRotomAchievement } from "../_types/Achievement"
import { parseDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Game } from "@/app/battlesim/replay/_components/Game"
import ActiveTeam from "./ActiveTeam"
import { achievementService } from "@/services/api/smartrotom/achievementsService"
import { useEffect, useState } from "react"

interface BadgePageProps {
  achievement: SmartRotomAchievement
  team: any
}

export function BadgePage({ achievement, team }: BadgePageProps) {
  const [replayData, setReplayData] = useState<any>(null)

  useEffect(() => {
    const fetchReplayData = async () => {
      try {
        const response = await achievementService.getReplay(achievement.uuid, achievement.battleId)
        setReplayData(response.data)
      } catch (error) {
        console.error("Error fetching replay data:", error)
      }
    }

    fetchReplayData()
  }, [achievement.uuid, achievement.battleId])


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
            <Dialog>
              <DialogTrigger className="text-sm hover:text-primary transition-colors">
                Ver Repetición
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 flex items-center justify-center">
                <Game replayData={replayData}/>
              </DialogContent>
            </Dialog>
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