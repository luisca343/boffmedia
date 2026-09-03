"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  LZ_PLATFORMS,
  LZ_TODAY,
  LzBannerCard,
  LzCalendarMonth,
  LzDateGroup,
  LzHypeMeter,
  LzPlatformPills,
  LzPosterCard,
  LzReleaseCard,
  LzTimeline,
  LzVersList,
  LzWeekStrip,
  LzWishStar,
  lzAddDays,
  lzKeyOf,
  lzMondayOf,
  lzParse,
  type LzRelease,
} from "@/components/boffmedia/ui/calendar"
import { LZ_RELEASES } from "./calendario-demo"

const noop = () => {}

export function CalendarioChapter() {
  const db = LZ_RELEASES
  const byId = (t: string): LzRelease => db.find((g) => g.title === t) || db[0]
  const big = byId("Elden Ring")
  const a = byId("Sekiro: Shadows Die Twice")
  const b = byId("No Man's Sky")

  const byDay: Record<string, LzRelease[]> = {}
  db.filter((g) => g.date).forEach((g) => {
    ;(byDay[g.date as string] = byDay[g.date as string] || []).push(g)
  })
  Object.values(byDay).forEach((arr) => arr.sort((x, y) => y.hype - x.hype))
  const wishedDemo = new Set<LzRelease["id"]>([big.id, a.id])

  const weekStart = lzMondayOf(LZ_TODAY)
  const weekDays = Array.from({ length: 7 }, (_, i) => lzAddDays(weekStart, i))

  const grpNext = { date: lzParse("2026-06-18"), items: ["Elden Ring", "Sekiro: Shadows Die Twice", "Tunic", "Dead Cells"].map(byId) }
  const grpToday = { date: lzParse(lzKeyOf(LZ_TODAY)), items: ["Hades", "Gran Turismo 7"].map(byId) }

  return (
    <>
      <Section
        id="lzatoms"
        kicker="Calendario"
        title="Plataforma, expectación y seguimiento"
        lead={
          <>
            Los átomos de cada estreno. <code>&lt;LzPlatformPills&gt;</code> codifica la plataforma por color (tonos oklch a L/C fijos → armónicos); <code>&lt;LzVersList&gt;</code> las presenta como versiones en lista separadas por «/», con mando opcional; <code>&lt;LzHypeMeter&gt;</code> traduce la expectación 1–5 a barras crecientes; <code>&lt;LzWishStar&gt;</code> es el seguidor ★ persistible.
          </>
        }
      >
        <Sample title="Plataformas" code="<LzPlatformPills platforms color compact max>" col>
          <div className="grid gap-3">
            <LzPlatformPills platforms={["ps5", "xbox", "switch", "pc", "mobile"]} />
            <LzPlatformPills platforms={["ps5", "xbox", "switch", "pc"]} compact />
            <LzPlatformPills platforms={["ps5", "xbox", "switch", "pc", "mobile"]} max={3} />
          </div>
        </Sample>
        <Sample title="Versiones en lista" code="<LzVersList platforms max icon>" col note="La forma que usan todas las tarjetas: etiquetas color-codificadas con «/» y «+N» de resto.">
          <div className="grid gap-3">
            <LzVersList platforms={["ps5", "xbox", "switch", "pc"]} />
            <LzVersList platforms={["ps5", "xbox", "switch", "pc", "mobile"]} max={2} icon />
          </div>
        </Sample>
        <Sample title="Expectación" code="<LzHypeMeter value showLabel>" col>
          <div className="grid gap-3">
            {[5, 4, 3, 2, 1].map((v) => (
              <LzHypeMeter key={v} value={v} showLabel />
            ))}
          </div>
        </Sample>
        <Sample title="Seguidor ★" code="<LzWishStar on onToggle>" note="Encendido en ámbar. La herramienta persiste el conjunto de seguidos en localStorage.">
          <LzWishStar on={false} onToggle={noop} />
          <LzWishStar on={true} onToggle={noop} />
        </Sample>
      </Section>

      <Section
        id="lzbanner"
        kicker="Calendario"
        title="Tarjeta banner"
        lead={
          <>
            La jerarquía de releases.com: los estrenos más esperados (hype ≥ 4) se promocionan a un <strong>banner destacado</strong>. El fondo es la carátula real del catálogo difuminada; encima, la carátula nítida, la cinta, título, plataforma y acciones (▶ ficha · seguir con contador · fecha). <strong>Nunca a todo el ancho</strong>: como máximo media fila, empaquetados 2 o 3 por fila. El hype 5 lleva la cinta «Popular»; el hype 4, «Muy esperado».
          </>
        }
      >
        <Sample title="Destacados · «Popular» (hype 5) y «Muy esperado» (hype 4)" code="<LzBannerCard game popular wished onWish onOpen>" col note="Fluyen en la misma rejilla de media fila (2–3 por fila). <code>popular</code> (o hype 5) enciende la cinta «Popular» y la barra de acento.">
          <div className="grid w-full gap-2.5 [grid-template-columns:repeat(3,minmax(0,1fr))]">
            <LzBannerCard game={big} popular wished onWish={noop} onOpen={noop} />
            <LzBannerCard game={byId("Sekiro: Shadows Die Twice")} popular={false} wished={false} onWish={noop} onOpen={noop} />
            <LzBannerCard game={byId("Hades")} popular={false} wished onWish={noop} onOpen={noop} />
          </div>
        </Sample>
      </Section>

      <Section
        id="lzcover"
        kicker="Calendario"
        title="Póster de estreno"
        lead={
          <>
            El resto de estrenos del día (hype ≤ 3) fluye como rejilla de <strong>pósteres</strong>: la carátula real del catálogo con el nombre y las plataformas debajo. El calendario es una herramienta aparte del Catálogo, así que aquí <strong>no</strong> va el botón de registrar en biblioteca — para seguir un lanzamiento se abre su ficha.
          </>
        }
      >
        <Sample title="Rejilla de estrenos normales" code="<LzPosterCard game onOpen>" col>
          <div className="grid w-full gap-x-3 gap-y-4 [grid-template-columns:repeat(auto-fill,minmax(9.875rem,1fr))]">
            {["Gran Turismo 7", "Tunic", "Dead Cells", "No Man's Sky", "Helldivers 2", "Inside"].map((t) => (
              <LzPosterCard key={t} game={byId(t)} onOpen={noop} />
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="lzcard"
        kicker="Calendario"
        title="Fila de estreno"
        lead={
          <>
            La variante compacta en fila, para listas densas: el <strong>modal de día</strong> del calendario mensual y cualquier ranking. <code>&lt;LzReleaseCard&gt;</code> alinea carátula rayada (glifo de género) · título · versiones y, al costado, el <strong>número de seguidores</strong> sobre el ★. <code>dense</code> reduce la escala; <code>showDate</code> añade la fecha bajo las versiones.
          </>
        }
      >
        <Sample title="Normal y con fecha" code="<LzReleaseCard game showDate wished onWish onOpen>" col>
          <div className="grid w-full gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]">
            <LzReleaseCard game={big} showDate wished onWish={noop} onOpen={noop} />
            <LzReleaseCard game={a} showDate wished={false} onWish={noop} onOpen={noop} />
          </div>
        </Sample>
        <Sample title="Densa (modal de día)" code="<LzReleaseCard dense>" col>
          <div className="grid w-full max-w-[28.75rem] gap-2">
            <LzReleaseCard game={b} dense wished={false} onWish={noop} onOpen={noop} />
            <LzReleaseCard game={a} dense wished onWish={noop} onOpen={noop} />
          </div>
        </Sample>
      </Section>

      <Section
        id="lzgroup"
        kicker="Calendario"
        title="Separador de fecha (agenda)"
        lead={
          <>
            La unidad de la lista infinita, replicando releases.com: la fecha es un <strong>separador</strong>, no una tarjeta. <code>&lt;LzDateGroup&gt;</code> encabeza con número de día, mes, día de la semana, tiempo relativo y contador sobre una regla; debajo <strong>escalona los estrenos por expectación</strong>: banners a media fila (hype ≥ 4) y rejilla de carátulas (resto). El día de <strong>hoy</strong> tiñe la regla y el número de acento.
          </>
        }
      >
        <Sample title="Un día con las tres jerarquías (18 jun)" code="<LzDateGroup date items today wished onWish onOpen>" col note="Con <code>id=&quot;lz-today-anchor&quot;</code> el grupo de hoy sirve de ancla para el auto-scroll. El estado seguido ★ viene de un <code>Set</code>.">
          <div className="grid w-full gap-7">
            <LzDateGroup date={grpNext.date} items={grpNext.items} today={LZ_TODAY} wished={wishedDemo} onWish={noop} onOpen={noop} />
            <LzDateGroup id="lz-today-anchor" date={grpToday.date} items={grpToday.items} today={LZ_TODAY} wished={wishedDemo} onWish={noop} onOpen={noop} />
          </div>
        </Sample>
      </Section>

      <Section
        id="lzmonth"
        kicker="Calendario"
        title="Rejilla de mes"
        lead={
          <>
            <code>&lt;LzCalendarMonth&gt;</code> es una rejilla genérica de lunes a domingo — no conoce los lanzamientos. Recibe <code>countFor(date)→n</code> para el contador de la celda y <code>renderDay(date)→node</code> para pintar su cuerpo, más <code>onSelectDay</code>. Recorta la fila sobrante automáticamente y resalta «hoy». Reutilizable para cualquier dato con fecha.
          </>
        }
      >
        <Sample title="Junio 2026 · con fichas de estreno" code="<LzCalendarMonth year month today countFor renderDay onSelectDay>" col note="El cuerpo de cada celda lo decide <code>renderDay</code>: aquí, fichas con barra de plataforma y «+N más». El anfitrión aporta los datos.">
          <div className="w-full">
            <LzCalendarMonth
              year={2026}
              month={5}
              today={LZ_TODAY}
              countFor={(d) => (byDay[lzKeyOf(d)] || []).length}
              onSelectDay={noop}
              renderDay={(d) => {
                const items = byDay[lzKeyOf(d)] || []
                if (!items.length) return null
                const shown = items.slice(0, 3)
                return (
                  <div className="flex flex-col gap-1">
                    {shown.map((g) => (
                      <span
                        key={g.id}
                        title={g.title}
                        style={{ "--ph": LZ_PLATFORMS[g.platforms[0]].color } as React.CSSProperties}
                        className={g.hype >= 5 ? "flex w-full items-center gap-1.5 overflow-hidden border border-solid border-line bg-[color-mix(in_oklab,var(--accent)_8%,var(--panel-2))] py-1 pl-[0.3125rem] pr-[0.4375rem] text-left" : "flex w-full items-center gap-1.5 overflow-hidden border border-solid border-line bg-panel-2 py-1 pl-[0.3125rem] pr-[0.4375rem] text-left"}
                      >
                        <span className="w-[3px] flex-none self-stretch bg-[color:var(--ph)]" />
                        <span className="truncate text-[0.71875rem] font-semibold">{g.title}</span>
                      </span>
                    ))}
                    {items.length > 3 && <span className="self-start px-0.5 py-[3px] font-mono text-[0.625rem]/none font-semibold tracking-[0.06em] text-txt-muted">+{items.length - 3} más</span>}
                  </div>
                )
              }}
            />
          </div>
        </Sample>
      </Section>

      <Section
        id="lzweek"
        kicker="Calendario"
        title="Tira de la semana"
        lead={
          <>
            <code>&lt;LzWeekStrip&gt;</code> es la tira de 7 columnas (lun→dom) con tarjetas por día — la que alimenta la vista «Semana». La columna de «hoy» se tiñe de acento; cada tarjeta lleva la barra de su plataforma principal y los puntos de todas sus plataformas.
          </>
        }
      >
        <Sample title="Semana del prototipo (15–21 jun 2026)" code="<LzWeekStrip days byDay today wished onOpen>" col>
          <div className="w-full">
            <LzWeekStrip days={weekDays} byDay={byDay} today={LZ_TODAY} wished={wishedDemo} onOpen={noop} />
          </div>
        </Sample>
      </Section>

      <Section
        id="lztime"
        kicker="Calendario"
        title="Línea de tiempo"
        lead={
          <>
            <code>&lt;LzTimeline&gt;</code> despliega los estrenos como un desplazador horizontal por meses: cada mes es una columna con sus títulos ordenados por fecha, los pasados atenuados y el mes en curso marcado en naranja. Vista panorámica de una ventana de lanzamientos.
          </>
        }
      >
        <Sample title="May–sep 2026" code="<LzTimeline releases today wished onOpen>" col note="Desplázate en horizontal. Reutiliza los mismos nodos que la vista «Timeline» de la herramienta.">
          <div className="w-full overflow-hidden">
            <LzTimeline releases={db.filter((g) => g.date)} today={LZ_TODAY} wished={wishedDemo} onOpen={noop} />
          </div>
        </Sample>
      </Section>
    </>
  )
}
