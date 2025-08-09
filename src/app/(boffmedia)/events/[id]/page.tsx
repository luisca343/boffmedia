"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useBoffSession } from "@/services/useBoffSession"
import Link from "next/link"

// Components
import { EventHero } from "./_components/EventHero"
import { EventStats } from "./_components/EventStats" 
import { ParticipantsGrid } from "./_components/ParticipantsGrid"
import { AchievementsSection } from "./_components/AchievementsSection"
import { Leaderboard } from "./_components/Leaderboard"
import { LoadingSpinner } from "./_components/LoadingSpinner"

export default function EventSummaryPage() {
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
    return <LoadingSpinner />
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Evento no encontrado</h1>
            <Link href="/events">
              <Button className="bg-gradient-to-r from-accent-600 to-indigo-600">
                Volver a eventos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        {/* Hero Section */}
        <EventHero event={event} participants={participants} />

        {/* Event Stats */}
        <EventStats event={event} participants={participants} achievements={achievements} />

        {/* Main Content - Steam Style Layout */}
        <div className="space-y-12">
          {/* Achievements Section */}
          <AchievementsSection 
            eventId={eventId} 
            achievements={achievements} 
            participants={participants} 
          />

          {/* Participants Section */}
          <ParticipantsGrid participants={participants} />

          {/* Leaderboard Section */}
          <Leaderboard leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  )
}