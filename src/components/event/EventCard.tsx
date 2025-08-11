import { Calendar, MapPin } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";
import { Button } from "@/components/ui/button";
import { Event } from "@/generated/api/models/Event";

interface EventCardProps {
  event: Event;
  href?: string;
  className?: string;
}

export function EventCard({ event, href, className = "" }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <InternalLink href={href || `/eventos/${event.id}`}>
      <div className={`bg-surface-800/60 backdrop-blur-sm rounded-2xl p-6 min-h-[320px] flex flex-col transition-all duration-300 group cursor-pointer border border-accent-500/20 ${className}`}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-accent-400">
              {event.status === Event.status.ACTIVE
                ? 'EN VIVO'
                : event.status === Event.status.UPCOMING
                ? 'PRÓXIMAMENTE'
                : event.status === Event.status.COMPLETED
                ? 'FINALIZADO'
                : 'DESCONOCIDO'}
            </span>
          </div>
          <h4 className="text-xl font-bold text-white mb-2 group-hover:text-accent-400 transition-colors">
            {event.title}
          </h4>
          <p className="text-surface-300 text-sm mb-4 line-clamp-2">{event.description}</p>
          <div className="space-y-2 text-sm text-surface-400 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{event.gameName}</span>
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <Button className="w-full mt-2 bg-gradient-to-r from-accent-600 to-secondary-600 hover:from-accent-700 hover:to-secondary-700">
          Ver Evento
        </Button>
      </div>
    </InternalLink>
  );
}
