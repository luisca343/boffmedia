"use client"

import Link from "next/link";
import { Calendar, Users, Clock, ChevronRight, Trophy, Server, MapPin, Star } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { Card, CardContent, CardFooter } from "@/components/ui/primitives/card";
import { useGetGames } from "@/hooks/events/useGetGames";
import { cn } from "@/lib/utils";
import { getEventStatus } from "@/lib/events";
import { Event } from "@/generated/api";
import { InternalLink } from "@/components/ui/navigation/Link";

interface EventCardProps {
  event: Event;
  layout?: "grid" | "list";
}

export function EventCard({ event, layout = "grid" }: EventCardProps) {
  const t = useTranslations('boffmedia');
  const { games } = useGetGames();
  const game = games?.find((g) => g.id === event.gameId);
  
  const status = getEventStatus(event.startDate, event.endDate);
  const isListLayout = layout === "list";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = t('eventsSection.locale') || 'en-US';
    return date.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case Event.type.EVENT: return Trophy;
      case Event.type.SERVER: return Server;
      default: return Calendar;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case Event.type.EVENT: return 'from-accent-500 to-secondary-600';
      case Event.type.SERVER: return 'from-secondary-500 to-accent-600';
      default: return 'from-surface-500 to-surface-600';
    }
  };

  const getStatusColorClass = (status: any) => {
    switch (status.key || status.label) {
      case 'active': return 'bg-gradient-to-r from-success-500 to-success-600';
      case 'upcoming': return 'bg-gradient-to-r from-secondary-500 to-secondary-600';
      case 'completed': return 'bg-gradient-to-r from-surface-500 to-surface-600';
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

    if (days > 0) return t('eventsSection.timeInDays', { days });
    if (hours > 0) return t('eventsSection.timeInHours', { hours });
    return t('eventsSection.verySoon');
  };

  const timeUntil = getTimeUntilEvent(event.startDate);
  const TypeIcon = getEventTypeIcon(event.type);
  
  return (
    <Card className={cn(
      "group bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:border-accent-400/40 hover:shadow-2xl hover:shadow-accent-500/20",
      isListLayout && "flex md:flex-row"
    )}>
      <div className={cn(
        "relative bg-gradient-to-br from-accent-500/20 to-secondary-500/20",
        isListLayout ? "w-full md:w-96 h-32 md:h-auto flex-shrink-0" : "h-48"
      )}>
        {event.banner ? (
          <img 
            src={event.banner} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-600 to-secondary-600 rounded-2xl flex items-center justify-center">
              <TypeIcon className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={cn("text-white text-xs font-bold px-3 py-1", getStatusColorClass(status))}>
            {t(`eventsSection.status.${status.key || (status.label === 'En Curso' ? 'active' : status.label === 'Próximo' ? 'upcoming' : status.label === 'Finalizado' ? 'completed' : 'unknown')}`) || status.label}
          </Badge>
        </div>

        {/* Countdown Badge */}
        {timeUntil && (status.key === 'upcoming' || status.label === 'Próximo') && (
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
        <CardContent
          className={cn(
            "p-6",
            isListLayout ? "flex-1" : "min-h-[320px] flex flex-col"
          )}
        >
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
              <span className="text-sm font-medium text-accent-400">{game?.title || `${t('eventsSection.gameLabel')} #${event.gameId}`}</span>
              <div className="text-xs text-surface-500">
                {event.type === Event.type.EVENT ? t('eventsSection.eventType') : t('eventsSection.serverType')}
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-400 transition-colors line-clamp-2">
            {event.title}
          </h3>
          
          <p className="text-surface-300 text-sm mb-4 line-clamp-3 leading-relaxed">
            {event.description}
          </p>
          
          <div className="space-y-2 text-sm text-surface-400 mt-auto">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            {event.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-400" />
                <span>{t('eventsSection.endLabel')} {formatDate(event.endDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-6 py-4 border-t border-surface-700/50 bg-surface-800/30">
          <div className="flex gap-3 w-full">
            <Button asChild variant="accent" className="flex-1">
              <InternalLink href={`/eventos/${event.id}`} className="flex items-center justify-center gap-2">
                {t('eventsSection.viewEvent')}
                <ChevronRight className="w-4 h-4" />
              </InternalLink>
            </Button>
            <Button variant="accentOutline" size="icon">
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}