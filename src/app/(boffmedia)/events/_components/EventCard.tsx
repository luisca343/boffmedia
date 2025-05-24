import Link from "next/link";
import { Calendar, Users, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useGetGames } from "@/hooks/events/useGetGames";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/events";

interface EventCardProps {
  event: Event;
  layout?: "grid" | "list";
}

export function EventCard({ event, layout = "grid" }: EventCardProps) {
  const { games } = useGetGames();
  const game = games?.find((g) => g.id === event.game);
  
  const getEventStatus = () => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now < startDate) {
      return { label: "Próximo", class: "bg-primary-500/20 text-primary-400 border-primary-500/30" };
    } else if (now > endDate) {
      return { label: "Finalizado", class: "bg-surface-500/20 text-surface-400 border-surface-500/30" };
    } else {
      return { label: "En Curso", class: "bg-success-500/20 text-success-400 border-success-500/30" };
    }
  };

  const status = getEventStatus();
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
  
  return (
    <Card className={cn(
      "bg-surface-800 border-surface-700 overflow-hidden transition-all hover:border-primary-500/50",
      isListLayout && "flex flex-col md:flex-row"
    )}>
      <div className={cn(
        "relative h-48 bg-surface-700",
        isListLayout && "w-full md:w-1/3 h-48"
      )}>
        {event.banner ? (
          <img 
            src={event.banner} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-700">
            <Calendar className="h-12 w-12 text-surface-500" />
          </div>
        )}
        <Badge className={cn(
          "absolute top-3 right-3", 
          status.class
        )}>
          {status.label}
        </Badge>
      </div>
      
      <div className={cn(
        "flex flex-col",
        isListLayout && "flex-1"
      )}>
        <CardContent className={cn("p-5", isListLayout && "flex-1")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center overflow-hidden">
              {game?.icon ? (
                <img src={game.icon} alt="" className="w-full h-full object-cover" />
              ) : (
                <Calendar className="h-3 w-3 text-surface-500" />
              )}
            </div>
            <span className="text-sm text-surface-300">{game?.title || `Juego #${event.game}`}</span>
          </div>
          
          <h3 className="text-xl font-semibold text-surface-50 mb-2 line-clamp-1">{event.title}</h3>
          
          {event.description && (
            <p className="text-surface-300 mb-4 line-clamp-2">{event.description}</p>
          )}
          
          <div className="space-y-2 text-sm text-surface-400">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>{formatDate(event.startDate)}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="px-5 py-4 border-t border-surface-700 bg-surface-800/50">
          <Button asChild className="w-full bg-primary-500 hover:bg-primary-600">
            <Link href={`/events/${event.id}`}>
              Ver detalles
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}