"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sample, Section } from "../showcase-shared"
import { DkBracket, DkSeg } from "@/components/boffmedia/ui/tools/datakit"
import {
  TnAvatar,
  TnBracketMatch,
  TnCrosstable,
  TnEntrant,
  TnFormatBadge,
  TnGroupCard,
  TnLeaderboard,
  TnLeagueTable,
  TnRadialBracket,
  TmMatchView,
  TmReportPanel,
  TmTeamsheet,
} from "@/components/boffmedia/ui/tournaments"
import { TN_GROUP, TN_LB, TN_LEAGUE, TN_MATCH, TN_RADIAL_STEPS, TN_SINGLE, TN_SOLO, TN_TEAM, tnRadialRounds } from "./torneos-demo"

const SLIDER =
  "h-1.5 flex-1 cursor-pointer appearance-none border border-solid border-line-2 bg-base outline-none [&::-webkit-slider-thumb]:h-[1.125rem] [&::-webkit-slider-thumb]:w-[1.125rem] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-panel [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cut-corner [--cut-lg:4px] [&::-moz-range-thumb]:h-[1.125rem] [&::-moz-range-thumb]:w-[1.125rem] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-panel [&::-moz-range-thumb]:bg-accent"
const CTL_LBL = "flex-none font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.14em] text-txt-dim"
const CTL_VAL = "min-w-[3.25rem] flex-none text-right font-display text-[1.375rem]/none font-extrabold tabular-nums text-accent-bright"

export function TorneosChapter() {
  const [seg, setSeg] = React.useState("table")
  const [radialIdx, setRadialIdx] = React.useState(2)
  const [radialPlayed, setRadialPlayed] = React.useState(99)
  const radialN = TN_RADIAL_STEPS[radialIdx]
  const radialTot = Math.round(Math.log2(radialN))
  const radialK = Math.min(radialPlayed, radialTot)
  const radial = React.useMemo(() => tnRadialRounds(radialN, radialK), [radialN, radialK])

  return (
    <>
      <Section id="tncompetidor" kicker="Torneos" title="Competidor genérico" lead={<>Una sola pieza sirve para las tres clases de competidor del circuito: jugador en solitario, equipo/escuadra y entrada puntuable. El avatar cae a inicial-en-hue cuando no hay bandera, y la etiqueta de formato rotula cualquier competición. Alimentado con datos de ejemplo. [aplazado]</>}>
        <Sample title="Entidad y avatar" code="<TnEntrant c> · <TnAvatar c>" col>
          <div className="grid w-full max-w-[22.5rem] gap-2.5">
            <TnEntrant c={TN_SOLO} onOpen={() => {}} />
            <TnEntrant c={TN_TEAM} onOpen={() => {}} />
            <span className="inline-flex gap-2">
              <TnAvatar c={TN_SOLO} size={30} />
              <TnAvatar c={TN_TEAM} size={30} />
              <TnAvatar c={null} size={30} />
            </span>
          </div>
        </Sample>
        <Sample title="Etiqueta de formato" code="<TnFormatBadge format>">
          {["swiss", "single", "double", "groups", "roundrobin", "leaderboard"].map((f) => (
            <TnFormatBadge key={f} format={f} />
          ))}
        </Sample>
      </Section>

      <Section id="tncuadros" kicker="Torneos" title="Cuadros de eliminación" lead={<>El asiento de cruce (<code>TnBracketMatch</code>) se monta sobre el layout <code>DkBracket</code> compartido, con estados jugando / final / campeón. La doble eliminación añade cuadro de perdedores y gran final con posible <em>bracket reset</em>.</>}>
        <Sample title="Eliminación simple" code="<DkBracket renderMatch={TnBracketMatch}>" col>
          <div className="w-full overflow-x-auto">
            <DkBracket rounds={TN_SINGLE} renderMatch={(m) => <TnBracketMatch m={m} onOpen={() => {}} champion={null} />} />
          </div>
        </Sample>
      </Section>

      <Section id="tngrupos" kicker="Torneos" title="Grupos, liga y crosstable" lead={<>La tarjeta de grupo y la tabla de liga comparten estructura (V-E-D, diferencia, puntos) con resaltado de plazas de clasificación y forma reciente. El crosstable cruza a todos contra todos en una matriz de resultados.</>}>
        <Sample title="Tarjeta de grupo" code="<TnGroupCard group advance>" col>
          <div className="w-full max-w-[28.75rem]">
            <TnGroupCard group={TN_GROUP} advance={2} onOpen={() => {}} />
          </div>
        </Sample>
        <Sample title="Liga y crosstable" code="<TnLeagueTable> · <TnCrosstable>" col>
          <div className="grid w-full gap-3">
            <DkSeg
              value={seg}
              onChange={setSeg}
              ariaLabel="Vista de liga"
              options={[
                { value: "table", label: "Clasificación" },
                { value: "cross", label: "Crosstable" },
              ]}
            />
            {seg === "table" ? <TnLeagueTable league={TN_LEAGUE} onOpen={() => {}} /> : <TnCrosstable crosstable={TN_LEAGUE.crosstable} onOpen={() => {}} />}
          </div>
        </Sample>
      </Section>

      <Section id="tnlibre" kicker="Torneos" title="Clasificación libre" lead={<>Para eventos sin cruces — concursos de builds, maratones cronometrados, speedruns: entradas ordenadas por puntuación o tiempo, con podio, barra proporcional y sello de verificación.</>}>
        <Sample title="Leaderboard" code="<TnLeaderboard lb>" col>
          <div className="w-full max-w-[35rem]">
            <TnLeaderboard lb={TN_LB} onOpen={() => {}} />
          </div>
        </Sample>
      </Section>

      <Section id="tnradial" kicker="Torneos" title="Cuadro radial" lead={<>Visualización circular para grandes eventos de eliminación: los competidores se reparten en el anillo exterior y los cruces convergen hacia el trofeo central, en dos mitades con huecos arriba y abajo. Cada anillo interior muestra al ganador de cada cruce; pasa el cursor por un competidor para trazar su ruta. Escala de 8 a 256 plazas y resalta al campeón.</>}>
        <Sample title="Radial escalable" code="<TnRadialBracket rounds championId>" col>
          <div className="grid w-full max-w-[42.5rem] gap-3.5">
            <div className="flex items-center gap-3.5">
              <span className={CTL_LBL}>Plazas</span>
              <input type="range" min={0} max={TN_RADIAL_STEPS.length - 1} step={1} value={radialIdx} aria-label="Número de competidores" onChange={(e) => setRadialIdx(parseInt(e.target.value, 10))} className={SLIDER} />
              <span className={CTL_VAL}>{radialN}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TN_RADIAL_STEPS.map((n, i) => (
                <button key={n} type="button" onClick={() => setRadialIdx(i)} className={cn("cursor-pointer border border-solid px-2.5 py-1.5 font-mono text-[0.6875rem]/none font-semibold transition-colors", i === radialIdx ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line bg-panel text-txt-muted hover:border-line-2 hover:text-txt")}>
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3.5">
              <span className={CTL_LBL}>Progreso</span>
              <input type="range" min={0} max={radialTot} step={1} value={radialK} aria-label="Rondas completadas" onChange={(e) => setRadialPlayed(parseInt(e.target.value, 10))} className={SLIDER} />
              <span className={CTL_VAL}>{radialK}/{radialTot}</span>
            </div>
            <TnRadialBracket rounds={radial.rounds} championId={radial.champion?.id} onOpen={() => {}} />
          </div>
        </Sample>
      </Section>

      <Section id="tnpartida" kicker="Torneos" title="Partida en directo · reporte manual" lead={<>Vista de mesa para torneos donde los jugadores reportan sus propios resultados (modelo LimitlessVGC), pensada para Pokémon VGC pero válida en cualquier competición al mejor de N. Reúne cabecera de ronda, tarjeta del rival, reporte BO3 con verificación del rival y <em>auto-verificación</em> por tiempo, chat de mesa con solicitud de juez, y la hoja de equipo del rival exportable a Showdown. Datos de ejemplo. [aplazado]</>}>
        <Sample title="Vista de mesa completa" code={`<TmMatchView me opp roundNo tableNo>`} col note={<>Reporta las tres partidas y envía: el resultado queda a la espera de la confirmación del rival con cuenta atrás de auto-verificación. Los sprites del equipo se resuelven cuando exista el resolvedor local. [aplazado]</>}>
          <div className="w-full">
            <TmMatchView comp={TN_MATCH.comp} me={TN_MATCH.me} opp={TN_MATCH.opp} roundNo={1} tableNo={2097} status="playing" standalone onCalc={() => {}} />
          </div>
        </Sample>
        <Sample title="Reporte entrante — te toca verificar" code={`<TmReportPanel initialScenario="incoming">`} col note={<>Cuando el rival reporta primero, el mismo panel muestra su resultado y ofrece verificar o disputar (lo que avisa a un juez).</>}>
          <div className="w-full max-w-[38.75rem]">
            <TmReportPanel me={TN_MATCH.me} opp={TN_MATCH.opp} initialScenario="incoming" onSystem={() => {}} />
          </div>
        </Sample>
        <Sample title="Hoja de equipo del rival" code="<TmTeamsheet opp>" col note={<>Seis tarjetas con sprite, objeto, habilidad, tipo Tera y movimientos. «Copiar equipo» vuelca el equipo en formato Pokémon Showdown al portapapeles.</>}>
          <div className="w-full">
            <TmTeamsheet opp={TN_MATCH.opp} onCalc={() => {}} />
          </div>
        </Sample>
      </Section>
    </>
  )
}
