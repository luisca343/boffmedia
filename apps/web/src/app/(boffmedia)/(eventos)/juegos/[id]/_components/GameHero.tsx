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
          <Button variant="ghost" className="text-ink hover:text-white hover:bg-layer-3">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver a Juegos
          </Button>
        </InternalLink>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-layer-2/80 via-secondary-soft/40 to-layer-2/80 backdrop-blur-sm border border-secondary/20 rounded-3xl overflow-hidden mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          
          {/* Game Icon and Info */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary-active/20 to-secondary-active/20 rounded-2xl flex items-center justify-center border border-secondary/20">
                {game.icon ? (
                  <img 
                    src={game.icon} 
                    alt={game.title}
                    className="w-16 h-16 object-contain rounded-lg"
                  />
                ) : (
                  <Gamepad2 className="w-16 h-16 text-secondary-hover" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={`${isActive 
                      ? "bg-success/80 text-white border-success-border/50" 
                      : "bg-layer-3/80 text-ink border-edge/50"
                    } flex items-center gap-1`}
                  >
                    <Activity className="w-3 h-3" />
                    {isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{game.title}</h1>
                <p className="text-ink text-lg leading-relaxed">
                  {game.description}
                </p>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="bg-layer-1/40 backdrop-blur-sm rounded-2xl p-6 border border-secondary/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary-hover" />
              Información del Juego
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-edge/50">
                <span className="text-ink-muted">Fecha de Creación:</span>
                <span className="text-white font-medium">{formatDate(game.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-edge/50">
                <span className="text-ink-muted">Última Actualización:</span>
                <span className="text-white font-medium">{formatDate(game.updatedAt)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-edge/50">
                <span className="text-ink-muted">Estado:</span>
                <span className={`font-medium ${isActive ? 'text-success-hover' : 'text-ink-muted'}`}>
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
