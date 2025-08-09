import Link from "next/link";
import { Calendar, Users, Clock, ChevronRight, Trophy, Server, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useGetGames } from "@/hooks/events/useGetGames";
import { cn } from "@/lib/utils";
import { getEventStatus } from "@/lib/events";
import type { Event } from "@/types/events";
import { Event as APIEvent } from "@/generated/api/models/Event";

interface EventCardProps {
  event: Event;
  layout?: "grid" | "list";
}

export function EventCard({ event, layout = "grid" }: EventCardProps) {
  const { games } = useGetGames();
  const game = games?.find((g) => g.id === event.gameId);
  
  const status = getEventStatus(event.startDate, event.endDate);
  const isListLayout = layout === "list";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case APIEvent.type.EVENT: return Trophy;
      case APIEvent.type.SERVER: return Server;
      default: return Calendar;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case APIEvent.type.EVENT: return 'from-accent-500 to-info-600';
      case APIEvent.type.SERVER: return 'from-secondary-500 to-info-600';
      default: return 'from-surface-500 to-surface-600';
    }
  };

  const getStatusColorClass = (status: any) => {
    switch (status.label) {
      case 'En Curso': return 'bg-gradient-to-r from-success-500 to-success-600';
      case 'Próximo': return 'bg-gradient-to-r from-secondary-500 to-info-600';
      case 'Finalizado': return 'bg-gradient-to-r from-surface-500 to-surface-600';
      default: return 'bg-gradient-to-r from-surface-500 to-surface-600';
    }
  };

  const getTimeUntilEvent = (dateString: string) => {
    const now = new Date().getTime();
    const eventTime = new Date(dateString).getTime();
    const difference = eventTime - now;

    if (difference < 0) return null;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `En ${days} días`;
    if (hours > 0) return `En ${hours} horas`;
    return 'Muy pronto';
  };

  const timeUntil = getTimeUntilEvent(event.startDate);
  const TypeIcon = getEventTypeIcon(event.type);
  
  return (
    <Card className={cn(
      "group bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:border-accent-400/40 hover:shadow-2xl hover:shadow-accent-500/20",
      isListLayout && "flex flex-col md:flex-row"
    )}>
      <div className={cn(
        "relative bg-gradient-to-br from-accent-500/20 to-secondary-500/20",
        isListLayout ? "w-full md:w-80 h-48" : "h-48"
      )}>
        {event.banner ? (
          <img 
            src={event.banner} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-600 to-info-600 rounded-2xl flex items-center justify-center">
              <TypeIcon className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={cn("text-white text-xs font-bold px-3 py-1", getStatusColorClass(status))}>
            {status.label}
          </Badge>
        </div>

        {/* Countdown Badge */}
        {timeUntil && status.label === 'Próximo' && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-secondary-500/90 text-white text-xs font-bold px-3 py-1">
              {timeUntil}
            </Badge>
          </div>
        )}

        {/* Event Type Icon */}
        <div className="absolute bottom-4 left-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${getEventTypeColor(event.type)} rounded-xl flex items-center justify-center shadow-lg`}>
            <TypeIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>
      
      <div className={cn(
        "flex flex-col",
        isListLayout && "flex-1"
      )}>
        <CardContent className={cn("p-6", isListLayout && "flex-1")}>
          {/* Game Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center overflow-hidden border border-surface-600">
              {game?.icon ? (
                <img src={game.icon} alt="" className="w-full h-full object-cover" />
              ) : (
                <Calendar className="h-4 w-4 text-surface-500" />
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-accent-400">{game?.title || `Juego #${event.gameId}`}</span>
              <div className="text-xs text-surface-500">
                {event.type === APIEvent.type.EVENT ? 'Evento' : 'Servidor'}
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-400 transition-colors line-clamp-2">
            {event.title}
          </h3>
          
          <p className="text-surface-300 text-sm mb-4 line-clamp-3 leading-relaxed">
            {event.description}
          </p>
          
          <div className="space-y-2 text-sm text-surface-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            {event.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-400" />
                <span>Hasta {formatDate(event.endDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-6 py-4 border-t border-surface-700/50 bg-surface-800/30">
          <div className="flex gap-3 w-full">
            <Button asChild className="flex-1 bg-gradient-to-r from-accent-600 to-info-600 hover:from-accent-700 hover:to-info-700 font-semibold">
              <Link href={`/events/${event.id}`} className="flex items-center justify-center gap-2">
                Ver detalles
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="border-accent-500/30 text-accent-400 hover:bg-accent-500/10">
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}