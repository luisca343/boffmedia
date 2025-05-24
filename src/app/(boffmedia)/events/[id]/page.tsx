"use client"

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar, ArrowLeft, Clock, Users, MapPin, 
  Calendar as CalendarIcon, Share2, AlertCircle 
} from "lucide-react";
import { EventsLoading } from "../_components/EventsLoading";
import { EventsError } from "../_components/EventsError";
import { Badge } from "@/components/ui/badge";
import { useGetGames } from "@/hooks/events/useGetGames";
import Link from "next/link";
import { Event, Game } from "@/types/events";
import { eventsService } from "@/services/api/smartrotom/eventsService";
import { EventRegistrationButton } from "../_components/EventRegistrationButton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import emoji from 'remark-emoji';
import { Markdown } from "@/components/Markdown";
import { getEventStatus } from "@/lib/events"; // Import the shared utility function

// Extend the Event interface to include child events
interface EventWithChildren extends Event {
  childEvents?: Event[];
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventWithChildren | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { games } = useGetGames();

  useEffect(() => {
    async function fetchEvent() {
      try {
        setIsLoading(true);
        const response = await eventsService.getEvent(parseInt(eventId));
        console.log("Fetched event:", response.data);
        setEvent(response.data as EventWithChildren);
        setError(null);
      } catch (err) {
        setError("No se pudo cargar el evento. Inténtalo de nuevo más tarde.");
        console.error("Error fetching event:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  // Remove the duplicate getEventStatus function and use the imported one instead
  const status = event ? getEventStatus(event.startDate, event.endDate) : { label: "Desconocido", class: "" };
  
  const game = event ? games?.find((g: Game) => g.id === event.game) : null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "No definida";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasChildEvents = event?.childEvents && event.childEvents.length > 0;

  if (isLoading) return <EventsLoading />;
  if (error || !event) return <EventsError error={error || "Evento no encontrado"} onRetry={() => router.refresh()} />;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Link href="/events" passHref>
        <Button 
          variant="ghost" 
          className="mb-6 text-surface-300 hover:text-surface-50"
          asChild
        >
          <div>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a eventos
          </div>
        </Button>
      </Link>

{/* Event Banner remains the same */}
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
        {event.banner ? (
          <img 
            src={event.banner} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-700">
            <Calendar className="h-24 w-24 text-surface-500" />
          </div>
        )}
        <Badge className={`absolute top-6 right-6 ${status.class} px-3 py-1 text-lg`}>
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Improved header with repositioned game icon */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              {/* Game Icon - Repositioned with more space */}
              <div className="relative mt-1">
                <div className="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center overflow-hidden border-2 border-surface-600">
                  {game?.icon ? (
                    <img src={game.icon} alt={game?.title || "Game"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-600 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-surface-400" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-surface-800 rounded-full px-2 py-0.5 border border-surface-600 text-xs font-medium text-surface-300 whitespace-nowrap">
                  {game?.title || event.gameName || "Game"}
                </div>
              </div>

              {/* Event Icon */}
              <div className="relative">
                <div className="w-16 h-16 rounded-lg bg-surface-700 flex items-center justify-center overflow-hidden border-2 border-primary-600/30">
                  {event.icon ? (
                    <img src={event.icon} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <Calendar className="h-8 w-8 text-primary-400" />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-surface-50">{event.title}</h1>
                {event.type === "server" && (
                  <div className="flex items-center mt-1 text-sm text-surface-300">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="capitalize">{event.type}</span>
                  </div>
                )}
              </div>
            </div>
          
          {/* Rich Content Section - Render markdown content */}
          {event.description && (
              <Markdown>{event.description}</Markdown>
          )}
          </div>

          {/* Child Events Section - Remain unchanged */}
          {event.type === "server" && hasChildEvents && (
            <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-surface-50 mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary-500" />
                Eventos Relacionados
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4">
                  {event.childEvents?.map((childEvent) => (
                    <div key={childEvent.id} className="border border-surface-700 rounded-lg overflow-hidden">
                      <Link href={`/events/${childEvent.id}`}>
                        <div className="flex items-center p-4 hover:bg-surface-700/50 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center overflow-hidden mr-4">
                            {childEvent.icon ? (
                              <img src={childEvent.icon} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Calendar className="h-6 w-6 text-surface-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-surface-50 font-semibold mb-1">{childEvent.title}</h4>
                            <div className="flex items-center text-sm text-surface-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(childEvent.startDate)}
                            </div>
                          </div>
                          {/* Use the shared utility function here as well */}
                          <Badge className={`ml-2 ${getEventStatus(childEvent.startDate, childEvent.endDate).class}`}>
                            {getEventStatus(childEvent.startDate, childEvent.endDate).label}
                          </Badge>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Event Meta Information */}
        <div className="space-y-6">
          <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-surface-50 mb-4">Detalles</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-primary-500 mr-3 mt-0.5" />
                <div>
                  <span className="block text-surface-50">Fecha de inicio</span>
                  <span className="text-surface-300">{formatDate(event.startDate)}</span>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-primary-500 mr-3 mt-0.5" />
                <div>
                  <span className="block text-surface-50">Fecha de finalización</span>
                  <span className="text-surface-300">{formatDate(event.endDate)}</span>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-primary-500 mr-3 mt-0.5" />
                <div>
                  <span className="block text-surface-50">Tipo</span>
                  <span className="text-surface-300 capitalize">{event.type}</span>
                </div>
              </div>

              {event.parentId > 0 && (
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-primary-500 mr-3 mt-0.5" />
                  <div>
                    <span className="block text-surface-50">Evento principal</span>
                    <Link 
                      href={`/events/${event.parentId}`}
                      className="text-primary-400 hover:text-primary-300 hover:underline"
                    >
                      Ver evento principal
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <EventRegistrationButton event={event} />
          
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              className="w-full border-surface-600"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // You could add a toast notification here
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartir Evento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}