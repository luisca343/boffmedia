"use client"

import { DEMO_ACHS, DEMO_EVENTS, DEMO_GAME, DEMO_TOP } from "../showcase-data"
import { Sample, Section } from "../showcase-shared"
import { Button, Ring } from "@boffmedia/ui"
import {
  AchievementItem,
  Countdown,
  EventBanner,
  EventCard,
  EventOrganizer,
  EventStatusChip,
  GameCard,
  GameHero,
  LeaderTable,
  MetaChip,
  ParticipantStack,
  PlayerLine,
  Podium,
  RarityTag,
} from "@/components/boffmedia/ui/events"
import { GameLogo } from "@/components/boffmedia/ui/tools"

const VGC_HUE = "hsl(18 62% 58%)"

export function JuegosChapter() {

  return (
    <>
            <Section id="jgcover" kicker="Juegos y Eventos" title="Portada de juego" lead={<>Tarjeta de juego (<code>GameCard</code>): arte de portada con velo, distintivo activo/inactivo y fecha de alta. Enlaza a <code>/juegos/[id]</code>.</>}>
              <Sample title="Tarjeta de juego" code="<GameCard game>" grid note={<>Los datos <code>short</code>, <code>events</code>, <code>players</code> y <code>hue</code> aún no están en la API de juegos — aquí van de ejemplo; en la página real se omiten. [aplazado]</>}>
                <GameCard game={DEMO_GAME} />
                <GameCard game={{ ...DEMO_GAME, id: 2, title: "Minecraft", deletedAt: "2024-06-01", hue: "hsl(140 45% 55%)", short: "MC", events: 3, players: 820 }} />
              </Sample>
            </Section>

            <Section id="gamehero" kicker="Juegos y Eventos" title="Cabecera de juego" lead={<>Cabecera full-bleed de la página de un juego (<code>GameHero</code>): arte de fondo, título/descripción y barra de datos (eventos · antigüedad). <code>children</code> añade los botones de acción. Extraída de <code>/juegos/[id]</code> a <code>ui/events/</code>.</>}>
              <Sample title="A todo lo ancho" code="<GameHero game eventCount liveCount>" col note={<>La barra usa <code>eventCount</code> (real) + <code>liveCount</code>/<code>players</code>/<code>short</code> (de ejemplo — aún no en la API). [aplazado]</>}>
                <div className="w-full">
                  <GameHero game={DEMO_GAME} eventCount={12} liveCount={2}>
                    <Button variant="pri" icon="trophy">Ver eventos</Button>
                    <Button icon="settings">Herramientas</Button>
                  </GameHero>
                </div>
              </Sample>
            </Section>

            <Section id="evcard" kicker="Juegos y Eventos" title="Tarjeta de evento" lead={<>Un solo componente <code>EventCard</code> con dos pieles: <em>rejilla</em> y <em>lista</em> (<code>layout=&quot;list&quot;</code>). Raíl y glifo tintados con el hue del juego, cuenta atrás para próximos, recuento y organizador. Enlaza a <code>/eventos/[id]</code>.</>}>
              <Sample title="Rejilla" code="<EventCard event>" grid note={<>Los datos <code>participants</code>, <code>organizer</code> y <code>hue</code> aún no están en la API de eventos — aquí van con datos de ejemplo; en la página real se omiten hasta que existan. [aplazado]</>}>
                {DEMO_EVENTS.map((e) => <EventCard key={e.id} event={e} />)}
              </Sample>
              <Sample title="Lista" code={`<EventCard event layout="list">`} col>
                <div className="grid w-full gap-3">
                  <EventCard event={DEMO_EVENTS[2]} layout="list" />
                  <EventCard event={DEMO_EVENTS[0]} layout="list" />
                </div>
              </Sample>
            </Section>

            <Section id="evstatus" kicker="Juegos y Eventos" title="Estado y cuenta atrás" lead={<>Los átomos de dato del evento: píldora de estado (<code>EventStatusChip</code>), cuenta atrás (<code>Countdown</code>), organizador (<code>EventOrganizer</code>) y el sello del juego (<code>GameLogo</code>).</>}>
              <Sample title="Estado" code="<EventStatusChip status label>">
                <EventStatusChip status="active" label="En curso" />
                <EventStatusChip status="upcoming" label="Próximo" />
                <EventStatusChip status="completed" label="Finalizado" />
                <EventStatusChip status="active" label="En directo" lg />
              </Sample>
              <Sample title="Cuenta atrás y sello" code="<Countdown date> · <GameLogo>">
                <Countdown date="2026-08-01T16:00:00" />
                <GameLogo label="VGC" hueColor="hsl(18 90% 55%)" />
                <GameLogo label="MC" hueColor="hsl(140 45% 55%)" size="sm" />
              </Sample>
              <Sample title="Organizador" code="<EventOrganizer organizer>" col note={<>Tres papeles: Boffmedia organiza, co-organizado (doble sello) o un tercero en la plataforma. <code>organizer</code> aún no está en la API de eventos. [aplazado]</>}>
                <div className="flex flex-col items-start gap-3">
                  <EventOrganizer organizer={{ role: "boffmedia", name: "Boffmedia", avatar: "B" }} />
                  <EventOrganizer organizer={{ role: "coorg", name: "Liga VGC España", avatar: "L" }} />
                  <EventOrganizer organizer={{ role: "platform", name: "Smash Barcelona", avatar: "S" }} />
                </div>
              </Sample>
              <Sample title="Organizador · bloque" code={`variant="block"`} col>
                <div className="grid w-full gap-4">
                  <EventOrganizer organizer={{ role: "boffmedia", name: "Boffmedia", avatar: "B" }} variant="block" />
                  <EventOrganizer organizer={{ role: "coorg", name: "Gremio de Cazadores", avatar: "G" }} variant="block" />
                  <EventOrganizer organizer={{ role: "platform", name: "Circuito VGC LATAM", avatar: "C" }} variant="block" />
                </div>
              </Sample>
              <Sample title="Tira de detalles" code="<MetaChip icon label value>" col note={<>El <code>hue</code> del juego tiñe el glifo; aún no está en la API de eventos. [aplazado]</>}>
                <div className="grid w-full gap-[10px] [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                  <MetaChip icon="clock" label="Inicia" value="16 Jun · 16:00" hue={VGC_HUE} />
                  <MetaChip icon="calendar" label="Finaliza" value="16 Jun · 23:00" hue={VGC_HUE} />
                  <MetaChip icon="trophy" label="Tipo" value="Torneo" hue={VGC_HUE} />
                  <MetaChip icon="gamepad" label="Juego" value="VGC" hue={VGC_HUE} />
                </div>
              </Sample>
            </Section>

            <Section id="evbanner" kicker="Juegos y Eventos" title="Banner de evento" lead={<>Cabecera full-bleed de la página de un evento (<code>EventBanner</code>): arte de fondo, estado + juego, título y descripción. <code>children</code> para inscripción/compartir. Extraída de <code>/eventos/[id]</code> a <code>ui/events/</code>.</>}>
              <Sample title="A todo lo ancho" code="<EventBanner event>" col>
                <div className="w-full">
                  <EventBanner event={DEMO_EVENTS[0]}>
                    <Button variant="pri" icon="trophy">Inscribirme</Button>
                    <Button icon="link">Compartir</Button>
                  </EventBanner>
                </div>
              </Sample>
            </Section>

            <Section id="evlogro" kicker="Juegos y Eventos" title="Logro y progreso" lead={<>Fila de logro/medalla (<code>AchievementItem</code>) con color de rareza. Compartida por el detalle de evento y <code>/logros</code>.</>}>
              <Sample title="Logros" code="<AchievementItem achievement>" col>
                <div className="grid gap-2 w-full">
                  {DEMO_ACHS.map((a) => <AchievementItem key={a.id} achievement={a} showEvent />)}
                </div>
              </Sample>
              <Sample title="Anillo y rareza" code="<Ring value> · <RarityTag rarity>">
                <Ring value={67} size={84}>67%</Ring>
                <div className="flex flex-wrap items-center gap-2">
                  {["bronze", "silver", "gold", "platinum", "diamond"].map((r) => <RarityTag key={r} rarity={r} />)}
                </div>
              </Sample>
            </Section>

            <Section id="evlead" kicker="Juegos y Eventos" title="Clasificación y podio" lead={<>Las piezas de ranking, reutilizadas en la clasificación global, en la página de juego y en el detalle de evento: <code>Podium</code> (top 3), <code>LeaderTable</code> (con destacado de «tú»), <code>PlayerLine</code> (lista compacta) y <code>ParticipantStack</code> (avatares apilados). Alimentadas con datos de ejemplo hasta que exista la API de clasificación. [aplazado]</>}>
              <Sample title="Podio" code="<Podium players>" col>
                <div className="w-full">
                  <Podium players={DEMO_TOP.slice(0, 3)} />
                </div>
              </Sample>
              <Sample title="Tabla" code="<LeaderTable players highlight>" col>
                <div className="w-full">
                  <LeaderTable players={DEMO_TOP.slice(0, 5)} highlight={DEMO_TOP[2]?.userId} />
                </div>
              </Sample>
              <Sample title="Fila compacta y avatares" code="<PlayerLine> · <ParticipantStack>" col>
                <div className="grid w-full gap-[10px]">
                  <div className="grid gap-2.5">
                    {DEMO_TOP.slice(0, 2).map((p, i) => <PlayerLine key={p.userId} player={p} rank={i + 1} />)}
                  </div>
                  <div className="mt-1.5">
                    <ParticipantStack players={DEMO_TOP.slice(0, 9)} max={7} />
                  </div>
                </div>
              </Sample>
            </Section>
    </>
  )
}
