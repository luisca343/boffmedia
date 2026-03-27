"use client"

import { Button } from "@/components/ui/primitives/button"
import { Badge } from "@/components/ui/primitives/badge"
import { ChevronLeft, Gamepad2, Activity, Calendar, Clock } from "lucide-react"
import { InternalLink } from "@/components/ui/navigation/Link"
import { Game } from "@boffmedia/shared"

interface GameHeroProps {
  game: Game
}

export function GameHero({ game }: GameHeroProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isActive = !game.deletedAt;

  return (
    <>
      {/* Navigation */}
      <div className="mb-8">
        <InternalLink href="/juegos">
          <Button variant="ghost" className="text-surface-300 hover:text-white hover:bg-surface-700">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver a Juegos
          </Button>
        </InternalLink>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-surface-800/80 via-accent-900/40 to-surface-800/80 backdrop-blur-sm border border-accent-500/20 rounded-3xl overflow-hidden mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          
          {/* Game Icon and Info */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-accent-600/20 to-secondary-600/20 rounded-2xl flex items-center justify-center border border-accent-500/20">
                {game.icon ? (
                  <img 
                    src={game.icon} 
                    alt={game.title}
                    className="w-16 h-16 object-contain rounded-lg"
                  />
                ) : (
                  <Gamepad2 className="w-16 h-16 text-accent-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={`${isActive 
                      ? "bg-success-500/80 text-white border-success-400/50" 
                      : "bg-surface-600/80 text-surface-300 border-surface-500/50"
                    } flex items-center gap-1`}
                  >
                    <Activity className="w-3 h-3" />
                    {isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{game.title}</h1>
                <p className="text-surface-300 text-lg leading-relaxed">
                  {game.description}
                </p>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="bg-surface-900/40 backdrop-blur-sm rounded-2xl p-6 border border-accent-500/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-400" />
              Información del Juego
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-surface-700/50">
                <span className="text-surface-400">Fecha de Creación:</span>
                <span className="text-white font-medium">{formatDate(game.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-surface-700/50">
                <span className="text-surface-400">Última Actualización:</span>
                <span className="text-white font-medium">{formatDate(game.updatedAt)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-surface-700/50">
                <span className="text-surface-400">Estado:</span>
                <span className={`font-medium ${isActive ? 'text-success-400' : 'text-surface-400'}`}>
                  {isActive ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
