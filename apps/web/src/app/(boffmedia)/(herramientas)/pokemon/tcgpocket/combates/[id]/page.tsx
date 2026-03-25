import { QuestData } from '../types'
import { QuestDisplay } from '../_components/QuestDisplay'
import { calculateTotalRewards } from '../utils/calculateTotalRewards'
import Image from 'next/image'
import { PtcgpService } from '@/services/api/boffmedia/ptcgpService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card'
import { getTranslations } from 'next-intl/server'

export default async function Combates({params} : {params: {id: string}}) {
  const { id } = params
  // Note: You'll need to implement getBattleData in the new service or use a different approach
  // const response = await PtcgpService.getBattleData(id)
  // const data = response.data as any as QuestData
  // const totalRewards = calculateTotalRewards(data.quests, data.commonRewards)
  const trans = await getTranslations('tcgpocket')
  
  // Temporary fallback until getBattleData is implemented
  const data = null;
  
  if(!data) return <div>Battle data not available with new API structure</div>

  // const totalRewards = calculateTotalRewards(data.quests, data.commonRewards)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-surface-200">Combates Individuales</h1>
      
      {/* <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recompensas Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Object.entries(totalRewards).map(([id, quantity]) => (
              <div key={id} className="flex items-center">
                <Image 
                  src={`/img/games/tcgpocket/image/${id}.png`}
                  alt={id}
                  width={32}
                  height={32}
                />
                <span className="ml-2 font-semibold">{trans(`item.${id}`)}: {quantity}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.quests.map((quest, index) => (
        <QuestDisplay key={index} quest={quest} commonRewards={data.commonRewards} />
      ))} */}
    </div>
  )
}