import type { SmartRotomAchievement } from "../_types/Achievement"
import { parseDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/primitives/dialog"
import { Game } from "@/app/battlesim/replay/_components/Game"
import ActiveTeam from "./ActiveTeam"
import { AchievementService, UserAchievement, Replay } from "@/services/api/smartrotom/achievementsService"
import { useEffect, useState } from "react"
import { PokemonW } from "@boffmedia/shared"
import { env } from "@/config/env.public"

interface BadgePageProps {
  achievement: UserAchievement
  team: PokemonW[]
}

export function BadgePage({ achievement, team }: BadgePageProps) {
  // TODO: any
  const [replayData, setReplayData] = useState<any>(null)

  useEffect(() => {
    const fetchReplayData = async () => {
      try {
        const response = await AchievementService.getReplay(achievement.uuid, achievement.battleId)
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
        <div className="flex items-center gap-4 ">
          <div className="relative">
            <div className="w-12 h-12 2xl:w-16 2xl:h-16 ml-4 mt-2 relative">
              <img
                src={`${env.NEXT_PUBLIC_API}/smartrotom/img/logros/${achievement.icon}.webp`}
                alt={achievement.name}
                className="relative z-10 w-full h-full object-contain"
              />
            </div>
          </div>
          <h2 className="text-2xl 2xl:text-4xl font-bold 2xl:m-2 font-vinque underline pt-4">{achievement.name}</h2>
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
        <ActiveTeam team={team} className="h-[95%]" />
      </div>
    </div>
  )
}