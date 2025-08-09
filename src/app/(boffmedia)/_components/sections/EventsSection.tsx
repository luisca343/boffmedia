import { getTranslations } from "next-intl/server";
import { Calendar, MapPin, Users, Trophy, Clock, Star, Zap, Gift, Server, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InternalLink } from "@/components/nav/Link";
import { SectionSeparator } from "../ui/SectionSeparator";
import { Event } from "@/generated/api/models/Event";

export async function EventsSection() {
  const t = await getTranslations("boffmedia");

  // Mock events data - replace with actual API call
  const events: Event[] = [
    {
      id: 1,
      title: 'Torneo de Batalla Pokémon',
      description: 'Enfréntate a los mejores entrenadores en batallas épicas y gana premios exclusivos.',
      gameId: 1,
      gameName: 'Pixelmon',
      icon: '/img/tournament-icon.png',
      banner: '/img/tournament-banner.jpg',
      startDate: '2024-08-15T18:00:00Z',
      endDate: '2024-08-15T22:00:00Z',
      status: Event.status.UPCOMING,
      visibility: Event.visibility.PUBLIC,
      type: Event.type.EVENT,
      createdAt: '2024-08-01T00:00:00Z',
      updatedAt: '2024-08-01T00:00:00Z'
    },
    {
      id: 2,
      title: 'Construcción Comunitaria',
      description: 'Únete a la comunidad para construir una nueva ciudad en el servidor.',
      gameId: 2,
      gameName: 'Minecraft',
      icon: '/img/building-icon.png',
      startDate: '2024-08-10T00:00:00Z',
      endDate: '2024-08-20T23:59:59Z',
      status: Event.status.ACTIVE,
      visibility: Event.visibility.PUBLIC,
      type: Event.type.SERVER,
      createdAt: '2024-08-01T00:00:00Z',
      updatedAt: '2024-08-01T00:00:00Z'
    },
    {
      id: 3,
      title: 'Caza del Tesoro Mensual',
      description: 'Explora el mundo y encuentra pistas para obtener recompensas especiales.',
      gameId: 1,
      gameName: 'Pixelmon',
      icon: '/img/treasure-icon.png',
      startDate: '2024-08-18T16:00:00Z',
      status: Event.status.UPCOMING,
      visibility: Event.visibility.PUBLIC,
      type: Event.type.EVENT,
      createdAt: '2024-08-01T00:00:00Z',
      updatedAt: '2024-08-01T00:00:00Z'
    }
  ];

  const featuredEvent = events.find(event => event.status === Event.status.ACTIVE) || events[0];
  const upcomingEvents = events.filter(event => event.status === Event.status.UPCOMING).slice(0, 3);
  const activeEvents = events.filter(event => event.status === Event.status.ACTIVE);

  const getEventTypeIcon = (type: Event.type) => {
    switch (type) {
      case Event.type.EVENT: return Trophy;
      case Event.type.SERVER: return Server;
      default: return Calendar;
    }
  };

  const getEventTypeColor = (type: Event.type) => {
    switch (type) {
      case Event.type.EVENT: return 'from-accent-500 to-accent-600';
      case Event.type.SERVER: return 'from-secondary-500 to-secondary-600';
      default: return 'from-surface-500 to-surface-600';
    }
  };

  const getStatusColor = (status: Event.status) => {
    switch (status) {
      case Event.status.ACTIVE: return 'from-success-500 to-success-600';
      case Event.status.UPCOMING: return 'from-secondary-500 to-secondary-600';
      case Event.status.COMPLETED: return 'from-surface-500 to-surface-600';
      default: return 'from-surface-500 to-surface-600';
    }
  };

  const getStatusText = (status: Event.status) => {
    switch (status) {
      case Event.status.ACTIVE: return 'EN VIVO';
      case Event.status.UPCOMING: return 'PRÓXIMAMENTE';
      case Event.status.COMPLETED: return 'FINALIZADO';
      default: return 'DESCONOCIDO';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilEvent = (dateString: string) => {
    const now = new Date().getTime();
    const eventTime = new Date(dateString).getTime();
    const difference = eventTime - now;

    if (difference < 0) return 'En vivo';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <section className="py-20 bg-gradient-to-b from-surface-950 via-purple-900/30 to-surface-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-info-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block relative">
            <h2 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-highlight-400 to-info-400 mb-4">
              Eventos Activos
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-accent-500 to-highlight-400 mx-auto rounded-full"></div>
            {/* Floating icons around title */}
            <div className="absolute -top-6 -left-12 w-8 h-8 bg-gradient-to-br from-accent-500 to-highlight-600 rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-6 -right-12 w-8 h-8 bg-gradient-to-br from-secondary-500 to-info-600 rounded-full flex items-center justify-center animate-bounce" style={{animationDelay: '0.5s'}}>
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xl text-surface-300 mt-6 max-w-3xl mx-auto">
            Únete a eventos emocionantes, compite con otros jugadores y gana recompensas exclusivas en nuestros servidores.
          </p>
        </div>

        {/* Featured Event - Hero Style */}
        {featuredEvent && (
          <div className="mb-16 relative">
            <div className="bg-gradient-to-r from-surface-800/80 via-accent-900/40 to-surface-800/80 backdrop-blur-sm border border-accent-500/20 rounded-3xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                {/* Event Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getEventTypeColor(featuredEvent.type)} rounded-xl flex items-center justify-center`}>
                      {(() => {
                        const Icon = getEventTypeIcon(featuredEvent.type);
                        return <Icon className="w-6 h-6 text-white" />;
                      })()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-purple-400 uppercase tracking-wide">Evento Destacado</span>
                      <div className={`inline-block px-3 py-1 bg-gradient-to-r ${getStatusColor(featuredEvent.status)} text-white text-xs font-bold rounded-full ml-3`}>
                        {getStatusText(featuredEvent.status)}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-white">{featuredEvent.title}</h3>
                  <p className="text-lg text-surface-300 leading-relaxed">{featuredEvent.description}</p>

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-surface-300">
                      <Clock className="w-5 h-5 text-accent-400" />
                      <div>
                        <div className="text-sm text-surface-400">Inicia</div>
                        <div className="font-semibold">{formatDate(featuredEvent.startDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-surface-300">
                      <MapPin className="w-5 h-5 text-accent-400" />
                      <div>
                        <div className="text-sm text-surface-400">Juego</div>
                        <div className="font-semibold">{featuredEvent.gameName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-surface-300">
                      <CalendarIcon className="w-5 h-5 text-accent-400" />
                      <div>
                        <div className="text-sm text-surface-400">Tipo</div>
                        <div className="font-semibold">{featuredEvent.type === Event.type.EVENT ? 'Evento' : 'Servidor'}</div>
                      </div>
                    </div>
                    {featuredEvent.endDate && (
                      <div className="flex items-center gap-3 text-surface-300">
                        <Clock className="w-5 h-5 text-accent-400" />
                        <div>
                          <div className="text-sm text-surface-400">Finaliza</div>
                          <div className="font-semibold">{formatDate(featuredEvent.endDate)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Countdown Timer */}
                  {featuredEvent.status === Event.status.UPCOMING && (
                    <div className="bg-surface-700/50 rounded-xl p-4 border border-accent-500/20">
                      <div className="text-center">
                        <div className="text-sm text-surface-400 mb-2">Tiempo restante</div>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-highlight-400">
                          {getTimeUntilEvent(featuredEvent.startDate)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button className="bg-gradient-to-r from-accent-600 to-highlight-600 hover:from-accent-700 hover:to-highlight-700 flex-1">
                      Unirse al Evento
                    </Button>
                    <Button variant="outline" className="border-accent-500/30 text-accent-400 hover:bg-accent-500/10">
                      Más Info
                    </Button>
                  </div>
                </div>

                {/* Event Visual */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-highlight-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-accent-600/10 to-highlight-600/10 rounded-2xl p-8 border border-accent-500/20 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-accent-500 to-highlight-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <Trophy className="w-12 h-12 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">¡Evento Épico!</h4>
                      <p className="text-surface-300">Prepárate para la aventura</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <SectionSeparator variant="purple" />

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
              <h3 className="text-2xl font-bold text-white">Eventos Activos</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-success-500/50 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEvents.map((event) => (
                <div key={event.id} className="bg-surface-800/60 backdrop-blur-sm border border-success-500/20 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${getEventTypeColor(event.type)} rounded-lg flex items-center justify-center`}>
                      {(() => {
                        const Icon = getEventTypeIcon(event.type);
                        return <Icon className="w-5 h-5 text-white" />;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                      <span className="text-success-400 text-sm font-medium">ACTIVO</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:text-success-400 transition-colors">
                    {event.title}
                  </h4>
                  <p className="text-surface-300 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-sm text-surface-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.gameName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{event.type === Event.type.EVENT ? 'Evento' : 'Servidor'}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Unirse Ahora
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-6 h-6 text-secondary-400" />
            <h3 className="text-2xl font-bold text-white">Próximos Eventos</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-500/50 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <div 
                key={event.id} 
                className="bg-surface-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 hover:scale-105 hover:border-blue-400/40 transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getEventTypeColor(event.type)} rounded-lg flex items-center justify-center`}>
                    {(() => {
                      const Icon = getEventTypeIcon(event.type);
                      return <Icon className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-surface-400">Inicia en</div>
                    <div className="text-sm font-bold text-secondary-400">{getTimeUntilEvent(event.startDate)}</div>
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-white mb-2 group-hover:text-secondary-400 transition-colors">
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
                
                <Button variant="outline" className="w-full border-secondary-500/30 text-secondary-400 hover:bg-secondary-500/10">
                  Recordarme
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-accent-800/20 via-info-800/20 to-secondary-800/20 backdrop-blur-sm border border-accent-500/30 rounded-3xl p-8">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400 mb-4">
              ¿Quieres ver más eventos?
            </h3>
            <p className="text-lg text-surface-300 mb-6 max-w-2xl mx-auto">
              Explora todos nuestros eventos pasados, presentes y futuros. Encuentra el evento perfecto para ti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-accent-600 to-info-600 hover:from-accent-700 hover:to-info-700">
                <InternalLink href="/eventos" className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Ver Todos los Eventos
                </InternalLink>
              </Button>
              <Button variant="outline" className="border-accent-500/30 text-accent-400 hover:bg-accent-500/10">
                <InternalLink href="/eventos/crear" className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Organizar Evento
                </InternalLink>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-50"></div>
      </div>
    </section>
  );
}