import { getTranslations } from "next-intl/server";
import { Calendar, MapPin, Trophy, Clock, Star, Server, Calendar as CalendarIcon, Bot } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { InternalLink } from "@/components/ui/navigation/Link";
import { SectionSeparator } from "../ui/SectionSeparator";
import { EventImage } from "../ui/EventImage";
import { Event } from "@boffmedia/shared";
import { EventsService } from "@/services/api/boffmedia/eventsService";
import { SectionHeader } from "@/components/boffmedia/sections";
import { CountdownTimer } from "../ui/CountdownTimer";
import { EventCard } from "@/components/boffmedia/event/EventCard";

export async function EventsSection() {
  const t = await getTranslations("boffmedia");

  // Fetch real events data
  let events: Event[] = [];
  try {
    events = (await EventsService.getEvents()).data!;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    // Fallback to empty array if API fails
    events = [];
  }

  // Filter and organize events
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
      case Event.status.ACTIVE: return t("eventsSection.status.live");
      case Event.status.UPCOMING: return t("eventsSection.status.upcoming");
      case Event.status.COMPLETED: return t("eventsSection.status.completed");
      default: return t("eventsSection.status.unknown");
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

  // If no events are available, show a message
  if (events.length === 0) {
    return (
      <section className="pt-20 pb-48 bg-gradient-to-b from-surface-950 via-accent-900/30 to-surface-800 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <SectionHeader
            title="Centro de Eventos"
            subtitle="Únete a eventos emocionantes, compite con otros jugadores y gana recompensas exclusivas en nuestros servidores."
            leftIcon={<Trophy className="w-4 h-4 text-white" />}
            rightIcon={<Star className="w-4 h-4 text-white" />}
          />
          {/* No Events Message */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-accent-800/20 to-secondary-800/20 backdrop-blur-sm border border-accent-500/30 rounded-3xl p-12">
              <div className="w-24 h-24 bg-gradient-to-br from-accent-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Calendar className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400 mb-4">
                {t("eventsSection.noEvents.title")}
              </h3>
              <p className="text-lg text-surface-300 mb-6 max-w-2xl mx-auto">
                {t("eventsSection.noEvents.description")}
              </p>
              <Button variant="accent" asChild>
                <InternalLink href="/eventos" className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {t("eventsSection.noEvents.exploreButton")}
                </InternalLink>
              </Button>
            </div>
          </div>
        </div>
        <BottomSVGWave />
      </section>
    );
  }

  return (
    <section className="pt-20 pb-48 bg-gradient-to-b from-surface-950 via-accent-900/30 to-surface-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
          <SectionHeader
            title="Centro de Eventos"
            subtitle="Únete a eventos emocionantes, compite con otros jugadores y gana recompensas exclusivas en nuestros servidores."
            leftIcon={<Trophy className="w-4 h-4 text-white" />}
            rightIcon={<Star className="w-4 h-4 text-white" />}
          />

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
                      <span className="text-sm font-medium text-accent-400 uppercase tracking-wide">{t("eventsSection.featured.label")}</span>
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
                        <div className="text-sm text-surface-400 mb-2">{t("eventsSection.featured.timeRemaining")}</div>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400">
                          <CountdownTimer targetDate={featuredEvent.startDate} liveLabel={t("eventsSection.featured.live")} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <InternalLink href={`/eventos/${featuredEvent.id}`} className="flex-1">
                      <Button variant="accent" className="w-full">
                        {featuredEvent.status === Event.status.ACTIVE ? 'Unirse al Evento' : 'Ver Evento'}
                      </Button>
                    </InternalLink>
                  </div>
                </div>

                {/* Event Visual */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-secondary-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-accent-600/10 to-secondary-600/10 rounded-2xl p-8 border border-accent-500/20 h-full flex items-center justify-center">
                    <div className="text-center">
                      {featuredEvent.banner ? (
                        <div className="w-full aspect-video max-h-64 rounded-2xl overflow-hidden mb-6 mx-auto flex items-center justify-center">
                          <EventImage
                            src={featuredEvent.banner}
                            alt={featuredEvent.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : featuredEvent.icon ? (
                        <div className="w-24 h-24 mx-auto mb-6">
                          <EventImage
                            src={featuredEvent.icon}
                            alt={featuredEvent.title}
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="w-24 h-24 bg-gradient-to-br from-accent-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Trophy className="w-12 h-12 text-white" />
                          </div>
                          <h4 className="text-xl font-bold text-white">{t("eventsSection.featured.comingSoon")}</h4>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <EventCard key={event.id} event={event}/>
                ))}
              </div>
            </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Clock className="w-6 h-6 text-secondary-400" />
                <h3 className="text-2xl font-bold text-white">Próximos Eventos</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-secondary-500/50 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event}  />
                ))}
              </div>
            </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-accent-800/20 to-secondary-800/20 backdrop-blur-sm border border-accent-500/30 rounded-3xl p-8">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400 mb-4">
              {t("eventsSection.cta.title")}
            </h3>
            <p className="text-lg text-surface-300 mb-6 max-w-2xl mx-auto">
              {t("eventsSection.cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" asChild>
                <InternalLink href="/eventos" className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t("eventsSection.cta.viewAll")}
                </InternalLink>
              </Button>
              <Button variant="accentOutline" asChild>
                <InternalLink href="/eventos/sugerir" className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {t("eventsSection.cta.suggest")}
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
    <BottomSVGWave />
    </section>
  );
}


export function BottomSVGWave() {
  return (
      <div className="absolute bottom-0 left-0 w-full overflow-hidden z-10 mt-8">
        <svg className="relative block w-full h-20" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" className="fill-secondary-600" ></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" className="fill-secondary-900 "></path>
        </svg>
      </div> 
  )
}