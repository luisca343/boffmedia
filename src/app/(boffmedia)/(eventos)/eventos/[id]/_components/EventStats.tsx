"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card"
import { Users, Trophy, Target } from "lucide-react"
import { useTranslations } from 'next-intl';
import { Event } from "@/generated/api/models/Event"

interface EventStatsProps {
  event: any
  participants: any[]
  achievements: any[]
}

export function EventStats({ event, participants, achievements }: EventStatsProps) {
  const t = useTranslations('boffmedia');
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Participants Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary-400" />
            {t('eventsSection.participantsLabel')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-cyan-400">
            {participants.length}
          </div>
          <p className="text-surface-400 text-sm">{t('eventsSection.participantsRegistered', { count: participants.length })}</p>
        </CardContent>
      </Card>

      {/* Achievements Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            {t('eventsSection.achievementsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            {achievements.length}
          </div>
          <p className="text-surface-400 text-sm">{t('eventsSection.achievementsAvailable')}</p>
        </CardContent>
      </Card>

      {/* Event Type Card */}
      <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-400" />
            {t('eventsSection.typeLabel')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-accent-400">
            {event.type === Event.type.EVENT ? t('eventsSection.eventType') : t('eventsSection.serverType')}
          </div>
          <p className="text-surface-400 text-sm">{t('eventsSection.gameMode')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
