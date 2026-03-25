"use client"

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { EventsService } from '@/services/api/boffmedia/eventsService'
import { Game } from '@boffmedia/shared'
import { SectionLoading, SectionError } from '@/components/boffmedia/sections'
import { GameHero } from './_components/GameHero'
import { GameEvents } from './_components/GameEvents'

export default function GameDetailPage() {
  const params = useParams()
  const gameId = parseInt(params.id as string)
  
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGame() {
      try {
        setIsLoading(true)
        const response = await EventsService.getGame(gameId)
        setGame(response.data || null)
      } catch (err: any) {
        setError(err.message || 'Error al cargar el juego')
      } finally {
        setIsLoading(false)
      }
    }

    if (gameId && !isNaN(gameId)) {
      fetchGame()
    } else {
      setError('ID de juego inválido')
      setIsLoading(false)
    }
  }, [gameId])

  if (isLoading) {
    return <SectionLoading text="Cargando juego..." subtext="Preparando información del juego" />
  }

  if (error) {
    return <SectionError error={error} onRetry={() => window.location.reload()} />
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-surface-300 mb-4">Juego no encontrado</h1>
            <p className="text-surface-400">El juego que buscas no existe o ha sido eliminado.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        <GameHero game={game} />
        
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-20 w-40 h-40 bg-accent-500/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-secondary-500/5 rounded-full blur-2xl"></div>
        </div>

        <div className="space-y-12">
          <GameEvents gameId={gameId} />
        </div>
      </div>
    </div>
  )
}
