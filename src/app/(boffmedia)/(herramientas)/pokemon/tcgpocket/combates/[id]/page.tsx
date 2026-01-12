import { QuestData } from '../types'
import { QuestDisplay } from '../_components/QuestDisplay'
import { calculateTotalRewards } from '../utils/calculateTotalRewards'
import Image from 'next/image'
import { PtcgpService } from '@/services/api/boffmedia/ptcgpService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card'
import { getTranslations } from 'next-intl/server'

export default async function Combates({params} : {params: {id: string}}) {
  const { id } = params
  const trans = await getTranslations('tcgpocket')
  
  // Temporary fallback until getBattleData is implemented
  const data = null;
  
  if(!data) return <div>{trans('errors.noBattleData')}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-surface-200">{trans('battles.title')}</h1>
    </div>
  )
}