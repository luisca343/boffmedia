import { Quest, CommonReward } from '../types'
import { DeckDisplay } from './DeckDisplay'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/primitives/card"
import { Separator } from "@/components/ui/primitives/separator"

interface QuestDisplayProps {
  quest: Quest
  commonRewards: CommonReward[]
}

export function QuestDisplay({ quest, commonRewards }: QuestDisplayProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{quest.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <DeckDisplay deckListing={quest.deckListing} />
        <Separator className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Tareas</h3>
        <ul className="space-y-2">
          {quest.battleTasks.map((task, index) => (
            <li key={index} className="flex justify-between items-center">
              <span>{task.mission}</span>
              <div className="flex items-center">
                <Image 
                  src={`/img/games/tcgpocket/image/${task.reward.id}.png`}
                  alt={task.reward.id}
                  width={24}
                  height={24}
                />
                <span className="ml-2 font-semibold">
                  {task.reward.quantity}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Recompensas por completar</h3>
        <div className="flex flex-wrap gap-4">
          {commonRewards.map((reward, index) => (
            <div key={index} className="flex items-center">
              <Image 
                src={`/img/games/tcgpocket/image/${reward.id}.png`}
                alt={reward.id}
                width={24}
                height={24}
              />
              <span className="ml-2">{reward.quantity}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

