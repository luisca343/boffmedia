"use client"

import * as React from "react"
import {
  Bar,
  Card,
  HoloStamp,
  Icon,
  Medal,
  PageHead,
  Paper,
  Stat,
  WaxSeal,
} from "@/app/smartrotom/pasaporte/_components/ui"
import { PasaporteLogroEntity, PasaporteStandingEntity } from "@boffmedia/shared"
import { Stamp } from "@/app/smartrotom/pasaporte/_components/chapters/Bitacora"
import { chapterVars } from "@/app/smartrotom/pasaporte/_utils/chapters"
import { badgeArt, sealInk } from "@/app/smartrotom/pasaporte/_utils/medals"
import { roman } from "@/app/smartrotom/pasaporte/_utils/roman"
import type { LogroTier, StandingTier } from "@/app/smartrotom/pasaporte/_types"
import { Sample, Section } from "../showcase-shared"
import { Leaf, PS_DEMO_SEALS, PS_DEMO_SEASON, PS_DEMO_STAMPS } from "./ps-demo"

/** The showcase is a static Spanish reference doc, not part of the Pasaporte app's own i18n. */
const TIER_LABEL: Record<LogroTier | StandingTier, string> = {
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
  platino: "Platino",
  diamante: "Diamante",
  maestro: "Maestro",
}

/**
 * Logros only reach `platino`; the season ladder carries on to `maestro`. Both come off the
 * API's own enums rather than from string literals — `LogroTier` and `StandingTier` are
 * aliases of the generated entity fields, so a rung renamed on the server breaks here at
 * compile time instead of painting an uncoloured medal.
 */
const LOGRO_TIERS: LogroTier[] = [
  PasaporteLogroEntity.tier.BRONCE,
  PasaporteLogroEntity.tier.PLATA,
  PasaporteLogroEntity.tier.ORO,
  PasaporteLogroEntity.tier.PLATINO,
]

const LADDER_TIERS: StandingTier[] = [
  PasaporteStandingEntity.tierKey.BRONCE,
  PasaporteStandingEntity.tierKey.PLATA,
  PasaporteStandingEntity.tierKey.ORO,
  PasaporteStandingEntity.tierKey.PLATINO,
  PasaporteStandingEntity.tierKey.DIAMANTE,
  PasaporteStandingEntity.tierKey.MAESTRO,
]

/**
 * The pieces that make the app a *document* rather than a profile page: what is struck into
 * the paper, what is inked onto it, and the runtime accent that lets one primitive be six
 * chapters.
 */
export function PsDocumentoChapter() {
  // Re-mounting the seals is the only way to see the strike, because the slam is an
  // entrance animation and entrances run once.
  const [strike, setStrike] = React.useState(0)

  return (
    <>
      <Section
        id="ps-lacres"
        kicker="Pasaporte · Documento"
        title="Lacres y medallas"
        lead={
          <>
            Un lacre se estampa <em>dentro</em> de la hoja — es lo más físico del libro. Ganado, es
            cera: el recorte festoneado, iluminado desde arriba a la izquierda, con el arte real de
            la medalla prensado encima. Sin ganar, es un <strong>gofrado ciego</strong>: una
            depresión en el papel, con un candado, iluminada <strong>desde abajo</strong>. Esa
            inversión de la luz es lo que hace que un hueco vacío se lea como «aquí no se estampó
            nada» y no como un botón desactivado — el estado nunca es sólo color: cambian la forma,
            la luz y el glifo.
          </>
        }
      >
        <Sample
          title="WaxSeal"
          code="<WaxSeal src alt earned tint slam />"
          app="ps"
          col
          note="La cera es un hash determinista del id de la medalla. Los logros NO tienen columna de tipo ni de elemento — el handoff pintaba cada sello con el tipo del líder de gimnasio, y ese campo no existe. Antes que inventarlo, la tinta se deriva del id: la misma medalla es siempre del mismo color, en todos los dispositivos. Es presentación, no dato: no se afirma nada sobre el gimnasio."
        >
          <Leaf accent="olive">
            <div className="flex flex-wrap items-end gap-6" key={strike}>
              {PS_DEMO_SEALS.map((seal) => (
                <div key={seal.id} className="flex flex-col items-center gap-2">
                  <WaxSeal
                    src={badgeArt(seal.icon)}
                    alt={seal.name}
                    earned={seal.earned}
                    tint={sealInk(seal.id)}
                    size={68}
                  />
                  <span className="text-center font-ps text-[11px] text-ps-ink-soft">
                    {seal.name}
                    <span className="block text-[10px] text-ps-ink-faint">
                      {seal.earned ? "sellada" : "sin sellar"}
                    </span>
                  </span>
                </div>
              ))}

              <div className="flex flex-col items-center gap-2">
                <WaxSeal
                  key={`slam-${strike}`}
                  src={badgeArt("gym_volcan")}
                  alt="Medalla Volcán"
                  earned
                  slam
                  tint={sealInk("gym_volcan")}
                  size={68}
                />
                <button
                  type="button"
                  onClick={() => setStrike((n) => n + 1)}
                  className="rounded-full border border-ps-ink/22 bg-white/50 px-2.5 py-1 font-ps text-[11px] text-ps-ink-soft transition-colors hover:border-ps-chapter hover:text-ps-chapter-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-chapter"
                >
                  Estampar de nuevo
                </button>
              </div>
            </div>
          </Leaf>
        </Sample>

        <Sample
          title="Medal"
          code='<Medal tier locked size />'
          app="ps"
          col
          note="Una moneda acuñada. `.ps-coin` lee `--ps-metal`, y `Medal` la apunta al token del propio escalón en vez de a una segunda copia del hex — una sola rampa de metales, declarada una vez, para que un logro de oro y un peldaño de oro no puedan divergir jamás. Los cuatro primeros son los metales de un logro; los seis, los de la escalera de temporada."
        >
          <Leaf accent="plum">
            <p className="mb-2 font-ps-mono text-[10px] uppercase tracking-[.2em] text-ps-ink-faint">
              Logros · cuatro metales
            </p>
            <div className="flex flex-wrap items-center gap-5">
              {LOGRO_TIERS.map((tier) => (
                <div key={tier} className="flex flex-col items-center gap-1.5">
                  <Medal tier={tier} size={48} />
                  <span className="font-ps text-[11px] text-ps-ink-soft">{TIER_LABEL[tier]}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-1.5">
                <Medal tier={PasaporteLogroEntity.tier.ORO} locked size={48} />
                <span className="font-ps text-[11px] text-ps-ink-faint">Bloqueado</span>
              </div>
            </div>

            <p className="mb-2 mt-4 font-ps-mono text-[10px] uppercase tracking-[.2em] text-ps-ink-faint">
              Escalera de temporada · seis peldaños
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {LADDER_TIERS.map((tier) => (
                <div key={tier} className="flex flex-col items-center gap-1.5">
                  <Medal tier={tier} size={38} />
                  <span className="font-ps text-[10px] text-ps-ink-soft">{TIER_LABEL[tier]}</span>
                </div>
              ))}
            </div>
          </Leaf>
        </Sample>

        <Sample
          title="El sello de temporada"
          code=".ps-holo-gold · .ps-foil · animate-ps-spin-slow"
          app="ps"
          col
          note="No es una primitiva del barril: se compone en `chapters/Temporada.tsx`, y aquí se reproduce para poder verla. Todo lo que dice es DERIVADO — no existe columna de LP en ninguna parte. `lp = max(0, victorias*20 − derrotas*12)` recorriendo las repeticiones reales de la ventana de la temporada, y de ahí caen el escalón, la división y el puesto regional. Un entrenador que no ha combatido no es «Bronce IV con 0 LP»: está SIN CLASIFICAR, y la página lo dice."
        >
          <Leaf accent="gild">
            <div className="relative mx-auto mb-4 grid h-[158px] w-[158px] place-items-center">
              <span
                aria-hidden="true"
                className="ps-holo-gold ps-loop absolute inset-0 rounded-full shadow-[0_7px_20px_rgba(120,90,30,.32),inset_0_0_0_2px_rgba(255,255,255,.45)] animate-ps-spin-slow motion-reduce:animate-none"
              />
              <div
                style={{ background: "radial-gradient(circle at 50% 30%, #fdf3cf, #e6c873 54%, #b8902f)" }}
                className="relative z-[2] grid h-[116px] w-[116px] place-items-center content-center rounded-full border-[3px] border-[#fff6d8] text-center shadow-[inset_0_0_0_3px_rgba(255,255,255,.5),inset_0_-6px_14px_rgba(120,80,20,.35),0_3px_9px_rgba(0,0,0,.3)]"
              >
                <span className="ps-foil font-ps-display text-[13px] font-extrabold tracking-[.12em]">
                  {roman(PS_DEMO_SEASON.number)}
                </span>
                <Icon name="crown" className="h-10 w-10 text-ps-gild-lo drop-shadow-[0_1px_1px_rgba(255,255,255,.5)]" />
                <span className="font-ps-ceremony text-[15px] leading-none text-[#5a3f12]">
                  {PS_DEMO_SEASON.tier} {PS_DEMO_SEASON.division}
                </span>
              </div>
              <span className="absolute -bottom-[7px] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-ps-ribbon to-ps-ribbon-hi px-[15px] py-1 font-ps-display text-[11px] font-extrabold tracking-[.08em] text-white shadow-[0_2px_6px_rgba(0,0,0,.32)]">
                {PS_DEMO_SEASON.name}
              </span>
            </div>

            {/* The six rungs. The API ships the ladder with every season payload, so the
                client never restates these numbers — only their metal. */}
            <ol className="mb-3 grid grid-cols-6 gap-1">
              {LADDER_TIERS.map((rung) => {
                const here = rung === PasaporteStandingEntity.tierKey.ORO
                return (
                  <li
                    key={rung}
                    aria-current={here ? "step" : undefined}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <Medal tier={rung} size={here ? 28 : 18} />
                    <span className="font-ps-mono text-[8px] uppercase tracking-[.03em] text-ps-ink-faint">
                      {TIER_LABEL[rung]}
                    </span>
                  </li>
                )
              })}
            </ol>

            <Card className="px-3.5 py-[11px]">
              <div className="mb-[7px] flex items-baseline justify-between gap-2 text-[12px] text-ps-ink-soft">
                <span>Progreso a Platino</span>
                <b className="ps-num font-ps-mono text-ps-ink">
                  {PS_DEMO_SEASON.lp} / {PS_DEMO_SEASON.nextAt} LP
                </b>
              </div>
              <Bar
                value={PS_DEMO_SEASON.lp}
                max={PS_DEMO_SEASON.nextAt}
                label="Progreso al siguiente rango"
              />
            </Card>
          </Leaf>
        </Sample>
      </Section>

      <Section
        id="ps-visados"
        kicker="Pasaporte · Documento"
        title="Visados y marginalia"
        lead={
          <>
            La Bitácora no sale de ninguna tabla de «lugares visitados» — no existe. Un sello es un
            hecho <strong>real y fechado</strong> que puso al entrenador en un sitio: una medalla de
            gimnasio conseguida, o un trayecto de Taxi pagado. El libro de trayectos{" "}
            <em>es</em> el registro de viajes, así que <code>_utils/bitacora.ts</code> importa{" "}
            <code>tripsFromTransactions</code> del propio Taxi y estampa la <em>primera</em> llegada
            a cada parada: un pasaporte sella una <em>entrada</em>, no cada trayecto.
          </>
        }
      >
        <Sample
          title="El sello de goma"
          code="<Stamp stamp index />"
          app="ps"
          col
          note="La forma y la inclinación se hashean del id — nunca se sortean. Un giro aleatorio se volvería a tirar en cada render, y un sello que se mueve al repintar la página no es tinta sobre papel: es una animación. El par `feTurbulence` + `feDisplacementMap` es lo que lo hace leerse como goma y no como vector, y `mix-blend-multiply` lo hunde en el papel en vez de posarlo encima."
        >
          <Leaf accent="teal">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PS_DEMO_STAMPS.map((stamp, i) => (
                <Stamp key={stamp.id} stamp={stamp} index={i} />
              ))}
            </div>
          </Leaf>
        </Sample>

        <Sample
          title="Paper · HoloStamp"
          code='<Paper side="left | right" /> · <HoloStamp show />'
          app="ps"
          col
          note="`Paper` es la hoja de verdad — la misma superficie que usa `Leaf` aquí, más la sombra del LOMO del lado por el que está encuadernada. Sin esa sombra el pliego se lee como dos rectángulos planos en vez de como un libro abierto. El `HoloStamp` sólo asoma bajo la lámpara: una medida de seguridad que se viera siempre no sería más que decoración."
        >
          <div className="grid w-full grid-cols-1 gap-0 sm:grid-cols-2">
            <div style={chapterVars("oxblood")} className="relative h-[240px] overflow-hidden rounded-l-[6px]">
              <Paper side="left">
                <PageHead eyebrow="Documento" title="Identidad" />
                <Stat icon="idcard" label="Titular" value="Luisca" sub="Fukitsu" />
              </Paper>
            </div>
            <div style={chapterVars("oxblood")} className="relative h-[240px] overflow-hidden rounded-r-[6px]">
              <Paper side="right">
                <PageHead eyebrow="Documento" title="Verso" />
                <p className="text-[12px] text-ps-ink-soft">
                  La hoja de la derecha lleva la sombra del lomo a su izquierda.
                </p>
                <HoloStamp show />
              </Paper>
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="ps-acento"
        kicker="Pasaporte · Documento"
        title="El acento en tiempo de ejecución"
        lead={
          <>
            La misma <code>PageHead</code>, la misma <code>Card</code>, la misma <code>Bar</code> —
            y ni una sola de las tres sabe en qué capítulo está. Un capítulo pone{" "}
            <code>style={"{"}chapterVars(accent){"}"}</code> en su raíz, eso fija el par{" "}
            <code>--ps-chapter</code> / <code>--ps-chapter-deep</code>, y todo lo de dentro lo hereda
            por <code>text-ps-chapter-deep</code>. Es lo que permite once capítulos con seis tintas y
            cero ramas de color en las primitivas — y los tripletes salen de un mapa literal, porque
            un <code>bg-ps-&lt;accent&gt;</code> interpolado no compilaría en absoluto (§4).
          </>
        }
      >
        <Sample
          title="Un mismo bloque, dos tintas"
          code="chapterVars('oxblood') vs chapterVars('plum')"
          app="ps"
          col
        >
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <Leaf accent="oxblood">
              <PageHead eyebrow="Documento" title="Identidad" accent="del Titular" />
              <Stat icon="foot" label="Distancia" value="182,4" sub="km recorridos" />
              <div className="mt-2.5">
                <Bar value={62} label="Completitud del pasaporte" />
              </div>
            </Leaf>
            <Leaf accent="plum">
              <PageHead eyebrow="Colección" title="Logros" accent="del Entrenador" />
              <Stat icon="star" label="Puntos" value="1.240" sub="de 3.000" />
              <div className="mt-2.5">
                <Bar value={41} label="Progreso de logros" />
              </div>
            </Leaf>
          </div>
        </Sample>
      </Section>
    </>
  )
}
