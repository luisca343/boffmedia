"use client"

import { Button } from "@/components/ui/primitives/button"
import { Badge } from "@/components/ui/primitives/badge"
import { 
  ArrowLeft, Calendar, Clock, Users, Trophy, 
  Share2, Bookmark, Zap, Server, 
  GamepadIcon as Gamepad2
} from "lucide-react"
import { Event } from "@/generated/api/models/Event"
import { EventRegistrationButton } from "../../_components/EventRegistrationButton"
import Link from "next/link"
import { InternalLink } from "@/components/ui/navigation/Link"

interface EventHeroProps {
  event: any
  participants: any[]
}

export function EventHero({ event, participants }: EventHeroProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventStatus = (startDate: string, endDate?: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null

    if (now < start) {
      return { label: 'Próximo', color: 'from-secondary-500 to-cyan-600', icon: Clock }
    } else if (end && now > end) {
      return { label: 'Finalizado', color: 'from-surface-500 to-surface-600', icon: Calendar }
    } else {
      return { label: 'En Curso', color: 'from-success-500 to-emerald-600', icon: Zap }
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case Event.type.EVENT: return Trophy
      case Event.type.SERVER: return Server
      default: return Calendar
    }
  }

  const getTimeUntilEvent = (dateString: string) => {
    const now = new Date().getTime()
    const eventTime = new Date(dateString).getTime()
    const difference = eventTime - now

    if (difference < 0) return null

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `En ${days} días`
    if (hours > 0) return `En ${hours} horas`
    return 'Muy pronto'
  }

  const status = getEventStatus(event.startDate, event.endDate)
  const timeUntil = getTimeUntilEvent(event.startDate)
  const TypeIcon = getEventTypeIcon(event.type)
  const StatusIcon = status.icon

  return (
    <>
      {/* Navigation */}
      <div className="mb-8">
        <InternalLink href="/eventos">
          <Button variant="ghost" className="text-surface-300 hover:text-surface-50 hover:bg-surface-800/50 border border-transparent hover:border-accent-500/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a eventos
          </Button>
        </InternalLink>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-surface-800/80 via-accent-900/40 to-surface-800/80 backdrop-blur-sm border border-accent-500/20 rounded-3xl overflow-hidden mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Event Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                {event.icon ? (
                  <img src={event.icon} alt="" className="w-12 h-12 rounded-xl" />
                ) : (
                  <TypeIcon className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <Badge className={`bg-gradient-to-r ${status.color} text-white px-4 py-2 text-sm font-bold`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {status.label}
                </Badge>
                {timeUntil && (
                  <div className="text-secondary-400 text-sm mt-1 font-medium">{timeUntil}</div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-pink-400 to-indigo-400 mb-4">
                {event.title}
              </h1>
              <p className="text-lg text-surface-300 leading-relaxed">{event.description}</p>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-surface-300">
                <Clock className="w-5 h-5 text-accent-400" />
                <div>
                  <div className="text-sm text-surface-400">Inicia</div>
                  <div className="font-semibold">{formatDate(event.startDate)}</div>
                </div>
              </div>
              {event.endDate && (
                <div className="flex items-center gap-3 text-surface-300">
                  <Calendar className="w-5 h-5 text-accent-400" />
                  <div>
                    <div className="text-sm text-surface-400">Finaliza</div>
                    <div className="font-semibold">{formatDate(event.endDate)}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-surface-300">
                <Users className="w-5 h-5 text-accent-400" />
                <div>
                  <div className="text-sm text-surface-400">Participantes</div>
                  <div className="font-semibold">{participants.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-surface-300">
                <Gamepad2 className="w-5 h-5 text-accent-400" />
                <div>
                  <div className="text-sm text-surface-400">Juego</div>
                  <div className="font-semibold">{event.gameName || `Juego #${event.gameId}`}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <EventRegistrationButton event={event} />
              <Button variant="accentOutline">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
              <Button variant="accentOutline">
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Event Visual */}
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
            <div className="relative h-full flex items-center justify-center">
              {event.banner ? (
                <img 
                  src={event.banner} 
                  alt={event.title} 
                  className="w-full rounded-xl"
                />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-accent-500 to-pink-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                    <TypeIcon className="w-16 h-16 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">¡Evento Increíble!</h4>
                  <p className="text-surface-300">Prepárate para la aventura</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
