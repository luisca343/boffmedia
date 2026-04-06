import { getTranslations } from "next-intl/server";
import { Calendar, MapPin, Trophy, Clock, Star, Server, Calendar as CalendarIcon } from "lucide-react";
import { Button, Container, Grid, Stack, Heading, Text, Divider } from "@/components/ui";
import { InternalLink } from "@/components/ui/navigation/Link";
import { EventImage } from "../ui/EventImage";
import { Event } from "@boffmedia/shared";
import { EventsService } from "@/services/api/boffmedia/eventsService";
import { SectionHeader } from "@/components/boffmedia/sections";
import { CountdownTimer } from "../ui/CountdownTimer";
import { EventCard } from "@/components/boffmedia/event/EventCard";

export async function EventsSection() {
  const t = await getTranslations("boffmedia");

  let events: Event[] = [];
  try {
    events = (await EventsService.getEvents()).data ?? [];
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  const featuredEvent = events.find((e) => e.status === Event.status.ACTIVE) || events[0];
  const upcomingEvents = events.filter((e) => e.status === Event.status.UPCOMING).slice(0, 3);
  const activeEvents = events.filter((e) => e.status === Event.status.ACTIVE);

  const getEventTypeIcon = (type: Event.type) => {
    switch (type) {
      case Event.type.EVENT: return Trophy;
      case Event.type.SERVER: return Server;
      default: return Calendar;
    }
  };

  const getEventTypeColor = (type: Event.type) => {
    switch (type) {
      case Event.type.EVENT: return "from-accent-500 to-accent-600";
      case Event.type.SERVER: return "from-secondary-500 to-secondary-600";
      default: return "from-surface-500 to-surface-600";
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const sectionHeader = (
    <SectionHeader
      title="Centro de Eventos"
      subtitle="Únete a eventos emocionantes, compite con otros jugadores y gana recompensas exclusivas en nuestros servidores."
      leftIcon={<Trophy className="w-4 h-4 text-white" />}
      rightIcon={<Star className="w-4 h-4 text-white" />}
    />
  );

  const bgEffects = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
    </div>
  );

  if (events.length === 0) {
    return (
      <section className="pt-20 pb-48 bg-gradient-to-b from-surface-950 via-accent-900/30 to-surface-800 relative overflow-hidden">
        {bgEffects}
        <Container size="lg" className="relative z-10">
          {sectionHeader}
          <div className="text-center">
            <div className="border border-primary-500/20 rounded-xl p-12 bg-surface-950/85">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center mb-6 mx-auto bg-primary-500/[0.08] border border-primary-500/20">
                <Calendar className="w-10 h-10 text-primary-400" />
              </div>
              <Heading as="h3" size="sm" weight="black" orbitron className="mb-3">
                {t("eventsSection.noEvents.title")}
              </Heading>
              <Text size="md" color="muted" className="mb-6 max-w-2xl mx-auto">
                {t("eventsSection.noEvents.description")}
              </Text>
              <Button variant="accent" asChild>
                <InternalLink href="/eventos" className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {t("eventsSection.noEvents.exploreButton")}
                </InternalLink>
              </Button>
            </div>
          </div>
        </Container>
        <BottomSVGWave />
      </section>
    );
  }

  return (
    <section className="pt-20 pb-48 bg-gradient-to-b from-surface-950 via-accent-900/30 to-surface-800 relative overflow-hidden">
      {bgEffects}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary-500/5 rounded-full blur-2xl pointer-events-none" />

      <Container size="lg" className="relative z-10">
        {sectionHeader}

        {/* Featured Event */}
        {featuredEvent && (
          <div className="mb-16">
            <div className="rounded-xl overflow-hidden border border-primary-500/15 bg-surface-950/90 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <Grid cols={1} colsLg={2} gap={8} className="p-8">
                {/* Event Info */}
                <Stack direction="vertical" gap={6}>
                  <Stack direction="horizontal" gap={3} align="center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getEventTypeColor(featuredEvent.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {(() => {
                        const Icon = getEventTypeIcon(featuredEvent.type);
                        return <Icon className="w-6 h-6 text-white" />;
                      })()}
                    </div>
                    <div>
                      <span className="text-xs font-mono text-primary-400/70 uppercase tracking-widest">
                        {t("eventsSection.featured.label")}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono ml-3 ${
                          featuredEvent.status === Event.status.ACTIVE
                            ? "bg-success-500/10 border border-success-500/30 text-success-400/90"
                            : "bg-accent-500/10 border border-accent-500/30 text-accent-300/90"
                        }`}
                      >
                        {featuredEvent.status === Event.status.ACTIVE && (
                          <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
                        )}
                        {getStatusText(featuredEvent.status)}
                      </span>
                    </div>
                  </Stack>

                  <Heading as="h3" size="md" weight="bold">{featuredEvent.title}</Heading>
                  <Text size="lg" color="muted" leading="relaxed">{featuredEvent.description}</Text>

                  <Grid cols={2} gap={4}>
                    <Stack direction="horizontal" gap={3} align="center" className="text-surface-300">
                      <Clock className="w-5 h-5 text-accent-400 flex-shrink-0" />
                      <div>
                        <Text as="div" size="sm" color="muted">Inicia</Text>
                        <Text as="div" size="sm" weight="semibold">{formatDate(featuredEvent.startDate)}</Text>
                      </div>
                    </Stack>
                    <Stack direction="horizontal" gap={3} align="center" className="text-surface-300">
                      <MapPin className="w-5 h-5 text-accent-400 flex-shrink-0" />
                      <div>
                        <Text as="div" size="sm" color="muted">Juego</Text>
                        <Text as="div" size="sm" weight="semibold">{featuredEvent.gameName}</Text>
                      </div>
                    </Stack>
                    <Stack direction="horizontal" gap={3} align="center" className="text-surface-300">
                      <CalendarIcon className="w-5 h-5 text-accent-400 flex-shrink-0" />
                      <div>
                        <Text as="div" size="sm" color="muted">Tipo</Text>
                        <Text as="div" size="sm" weight="semibold">
                          {featuredEvent.type === Event.type.EVENT ? "Evento" : "Servidor"}
                        </Text>
                      </div>
                    </Stack>
                    {featuredEvent.endDate && (
                      <Stack direction="horizontal" gap={3} align="center" className="text-surface-300">
                        <Clock className="w-5 h-5 text-accent-400 flex-shrink-0" />
                        <div>
                          <Text as="div" size="sm" color="muted">Finaliza</Text>
                          <Text as="div" size="sm" weight="semibold">{formatDate(featuredEvent.endDate)}</Text>
                        </div>
                      </Stack>
                    )}
                  </Grid>

                  {featuredEvent.status === Event.status.UPCOMING && (
                    <div className="rounded-lg p-4 border border-primary-500/15 bg-surface-950/60">
                      <div className="text-center">
                        <Text size="sm" color="muted" className="mb-2">
                          {t("eventsSection.featured.timeRemaining")}
                        </Text>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400">
                          <CountdownTimer
                            targetDate={featuredEvent.startDate}
                            liveLabel={t("eventsSection.featured.live")}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <InternalLink href={`/eventos/${featuredEvent.id}`} className="flex-1">
                    <Button variant="accent" className="w-full">
                      {featuredEvent.status === Event.status.ACTIVE ? "Unirse al Evento" : "Ver Evento"}
                    </Button>
                  </InternalLink>
                </Stack>

                {/* Event Visual */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-secondary-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-gradient-to-br from-accent-600/10 to-secondary-600/10 rounded-2xl p-8 border border-accent-500/20 h-full flex items-center justify-center">
                    <div className="text-center">
                      {featuredEvent.banner ? (
                        <div className="w-full aspect-video max-h-64 rounded-2xl overflow-hidden mb-6 mx-auto flex items-center justify-center">
                          <EventImage src={featuredEvent.banner} alt={featuredEvent.title} className="w-full h-full object-cover" />
                        </div>
                      ) : featuredEvent.icon ? (
                        <div className="w-24 h-24 mx-auto mb-6">
                          <EventImage src={featuredEvent.icon} alt={featuredEvent.title} className="w-full h-full" />
                        </div>
                      ) : (
                        <>
                          <div className="w-24 h-24 bg-gradient-to-br from-accent-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Trophy className="w-12 h-12 text-white" />
                          </div>
                          <Heading as="h4" size="xs" weight="bold">{t("eventsSection.featured.comingSoon")}</Heading>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Grid>
            </div>
          </div>
        )}

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <div className="mb-16">
            <Divider
              variant="accent"
              labelPosition="left"
              label={
                <Stack direction="horizontal" gap={2} align="center">
                  <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
                  <span
                    className="text-sm font-mono uppercase tracking-widest text-success-400/85"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    Eventos Activos
                  </span>
                </Stack>
              }
              className="mb-8"
            />
            <Grid cols={1} colsMd={2} colsLg={3} gap={6}>
              {activeEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Grid>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-16">
            <Divider
              labelPosition="left"
              label={
                <Stack direction="horizontal" gap={2} align="center">
                  <Clock className="w-3.5 h-3.5 text-secondary-400" />
                  <span
                    className="text-sm font-mono uppercase tracking-widest text-secondary-400/80"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    Próximos Eventos
                  </span>
                </Stack>
              }
              className="mb-8"
            />
            <Grid cols={1} colsMd={2} colsLg={3} gap={6}>
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Grid>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <div className="rounded-xl p-8 border border-primary-500/20 bg-surface-950/85 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <Heading as="h3" size="sm" weight="black" orbitron className="mb-3">
              {t("eventsSection.cta.title")}
            </Heading>
            <Text size="md" color="muted" className="mb-6 max-w-2xl mx-auto">
              {t("eventsSection.cta.description")}
            </Text>
            <Stack direction="horizontal" gap={4} wrap justify="center">
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
            </Stack>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-0 left-0 w-full pointer-events-none">
        <div className="h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-50" />
      </div>
      <BottomSVGWave />
    </section>
  );
}

export function BottomSVGWave() {
  return (
    <div className="absolute bottom-0 left-0 w-full overflow-hidden z-10 mt-8">
      <svg className="relative block w-full h-20" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" className="fill-secondary-600" />
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" className="fill-secondary-900" />
      </svg>
    </div>
  );
}
