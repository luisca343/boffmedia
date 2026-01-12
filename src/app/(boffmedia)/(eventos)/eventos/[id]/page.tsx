"use client"

import { useParams } from "next/navigation"
import { useTranslations } from 'next-intl';
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/primitives/button"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useBoffSession } from "@/services/useBoffSession"
import Link from "next/link"

// Components
import { EventHero } from "./_components/EventHero"
import { EventStats } from "./_components/EventStats" 
import { ParticipantsGrid } from "./_components/ParticipantsGrid"
import { AchievementsSection } from "./_components/AchievementsSection"
import { Leaderboard } from "./_components/Leaderboard"
import { SectionLoading } from '@/components/boffmedia/sections'
import { InternalLink } from "@/components/ui/navigation/Link"

export default function EventSummaryPage() {
  const t = useTranslations('boffmedia');
  const params = useParams()
  const eventId = parseInt(params.id as string)
  const { session } = useBoffSession()
  
  const [event, setEvent] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchEventData() {
      try {
        setIsLoading(true)
        
        // Fetch core event data first (required)
        const [eventResponse, participantsResponse, achievementsResponse] = await Promise.all([
          EventsService.getEvent(eventId),
          EventsService.getEventParticipants(eventId),
          EventsService.getEventAchievements(eventId)
        ])
        
        setEvent(eventResponse.data)
        setParticipants(participantsResponse.data || [])
        setAchievements(achievementsResponse.data || [])
        
        // Try to fetch leaderboard data (optional - may not be implemented yet)
        try {
          const leaderboardResponse = await EventsService.getLeaderboard(eventId)
          setLeaderboard(leaderboardResponse.data || [])
        } catch (leaderboardError) {
          console.warn("Leaderboard API not available yet, using empty array:", leaderboardError)
          setLeaderboard([])
        }
        
      } catch (error) {
        console.error("Error fetching event data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId && !isNaN(eventId)) {
      fetchEventData()
    }
  }, [eventId])

  if (isLoading) {
    return <SectionLoading text={t('eventsSection.loading')} subtext={t('eventsSection.subtitle')} />
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">{t('eventsSection.noEventFound')}</h1>
            <InternalLink href="/eventos">
              <Button variant="accent">
                {t('eventsSection.backToEvents')}
              </Button>
            </InternalLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        <EventHero event={event} participants={participants} />
        
        {/*<EventStats event={event} participants={participants} achievements={achievements} />*/}

        <div className="space-y-12">
          <AchievementsSection 
            eventId={eventId} 
            achievements={achievements} 
            participants={participants} 
          />

          <ParticipantsGrid participants={participants} />
          <Leaderboard leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  )
}