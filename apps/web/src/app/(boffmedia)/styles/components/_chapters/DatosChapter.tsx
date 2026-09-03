"use client"

import * as React from "react"
import { DEMO_SPRITE, DEMO_TEAM } from "../showcase-data"
import { Sample, Section } from "../showcase-shared"
import { Button } from "@boffmedia/ui"
import {
  DkBarList,
  DkCountryFilter,
  DkEmpty,
  DkFlag,
  DkHeat,
  DkLive,
  DkPin,
  DkSearch,
  DkSeg,
  DkSelect,
  DkSkelList,
  DkSplit,
  DkSprite,
  DkStat,
  DkStepper,
  DkTable,
  DkTeam,
  DkTrend,
  DkType,
  DkUpdated,
  useDkToast,
} from "@/components/boffmedia/ui/tools/datakit"

const COUNTRIES = [
  { code: "ES", flag: "🇪🇸", name: "España", n: 46 },
  { code: "JP", flag: "🇯🇵", name: "Japón", n: 38 },
  { code: "US", flag: "🇺🇸", name: "Estados Unidos", n: 35 },
  { code: "IT", flag: "🇮🇹", name: "Italia", n: 21 },
  { code: "DE", flag: "🇩🇪", name: "Alemania", n: 17 },
  { code: "BR", flag: "🇧🇷", name: "Brasil", n: 12 },
]
const TABLE_ROWS = [
  { name: "Incineroar", uso: 51.2, delta: 2.1 },
  { name: "Flutter Mane", uso: 44.8, delta: -1.4 },
  { name: "Rillaboom", uso: 38.1, delta: 0.8 },
  { name: "Urshifu", uso: 33.5, delta: 3.2 },
]
const ELO = [1500, 1516, 1531, 1522, 1540, 1554, 1548, 1566, 1580, 1573, 1591, 1608]
const RESULTS = ["win", "win", "win", "loss", "win", "win", "loss", "win", "win", "loss", "win", "win"]

function PinDemo() {
  const [on, setOn] = React.useState(true)
  return <DkPin on={on} onClick={() => setOn(!on)} />
}
function ToastDemo() {
  const [toast, show] = useDkToast()
  return (
    <>
      <Button size="sm" icon="plus" onClick={() => show("Demo de solo lectura — el registro llegará con el backend.")}>
        Acción de demo
      </Button>
      {toast}
    </>
  )
}

export function DatosChapter() {
  const [q, setQ] = React.useState("")
  const [seg, setSeg] = React.useState("all")
  const [sel, setSel] = React.useState("regi")
  const [countries, setCountries] = React.useState<string[]>(["ES"])
  const [step, setStep] = React.useState("r5")
  const [sortKey, setSortKey] = React.useState<"uso" | "delta">("uso")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    else {
      setSortKey(k as "uso" | "delta")
      setSortDir("desc")
    }
  }
  const sorted = [...TABLE_ROWS].sort((a, b) => (sortDir === "desc" ? -1 : 1) * (a[sortKey] - b[sortKey]))

  return (
    <>
      <Section id="dkpiezas" kicker="Datos en vivo" title="Sprites y jugador" lead={<>Las piezas atómicas de las herramientas de datos: sprite con reserva tipográfica, fila de equipo, tipos canónicos, bandera y la estrella de «seguir jugador».</>}>
        <Sample title="Sprite y equipo" code="<DkSprite> · <DkTeam slots>">
          <DkSprite src={DEMO_SPRITE} alt="" title="Incineroar" size={44} />
          <DkSprite alt="" title="Desconocido" size={44} />
          <DkTeam slots={DEMO_TEAM} size={30} />
        </Sample>
        <Sample title="Tipo, bandera y pin" code="<DkType> · <DkFlag> · <DkPin>">
          <DkType type="Fuego" />
          <DkType type="Fantasma" />
          <DkType type="Planta" small />
          <DkFlag flag="🇪🇸" code="ES" name="España" size={18} />
          <PinDemo />
        </Sample>
      </Section>

      <Section id="dktabla" kicker="Datos en vivo" title="Tabla de datos" lead={<>Tabla densa con cabecera pegajosa y columnas ordenables (<code>aria-sort</code> incluido). Es la base de la clasificación de torneos, los jugadores del Meta y la divergencia.</>}>
        <Sample title="Ordenable" code="<DkTable columns sortKey onSort>" col>
          <div className="w-full">
            <DkTable
              ariaLabel="Demo de tabla"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              columns={[
                { key: "n", label: "#", w: 40 },
                { key: "pk", label: "Pokémon" },
                { key: "uso", label: "Uso", w: 90, align: "right", sortable: true },
                { key: "delta", label: "Δ mes", w: 90, align: "right", sortable: true },
              ]}
            >
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={r.name} className="is-click">
                    <td className="mono" style={{ color: "var(--dim)" }}>
                      {i + 1}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-[0.5625rem] font-semibold">
                        <DkSprite src={DEMO_SPRITE} alt="" size={28} />
                        {r.name}
                      </span>
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {r.uso.toFixed(1)}%
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: r.delta > 0 ? "var(--ok)" : "var(--bad)" }}>
                      {r.delta > 0 ? "+" : ""}
                      {r.delta.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </DkTable>
          </div>
        </Sample>
      </Section>

      <Section id="dkfiltros" kicker="Datos en vivo" title="Filtros y búsqueda" lead={<>Búsqueda con limpieza, segmentado con recuentos y select mono para contextos (formato, mes, torneo). El filtro de país es multi-selección con buscador, recuentos por país y píldoras retirables.</>}>
        <Sample title="Barra de filtrado" code="<DkSearch> · <DkSeg counts> · <DkSelect>" col>
          <div className="flex w-full flex-wrap items-center gap-2.5">
            <DkSearch value={q} onChange={setQ} placeholder="Busca tu nombre o mesa…" />
            <DkSeg value={seg} onChange={setSeg} options={[{ value: "all", label: "Todas", count: 128 }, { value: "playing", label: "Jugando", count: 31 }, { value: "final", label: "Final", count: 97 }]} />
            <DkSelect value={sel} onChange={setSel} options={[{ value: "regi", label: "VGC 2026 · Reg I" }, { value: "regh", label: "VGC 2026 · Reg H" }]} />
          </div>
        </Sample>
        <Sample title="Filtro de país" code="<DkCountryFilter options value>" col>
          <DkCountryFilter options={COUNTRIES} value={countries} onChange={setCountries} resultCount={46} noun="jugadores" />
        </Sample>
      </Section>

      <Section id="dkindicadores" kicker="Datos en vivo" title="Indicadores" lead={<>KPI con tono semántico, barra proporcional victoria/derrota, estados en vivo y el «actualizado hace Ns» con refresco manual.</>}>
        <Sample title="KPI" code="<DkStat value label tone>">
          <div className="grid w-full max-w-[35rem] grid-cols-2 gap-2 sm:grid-cols-4">
            <DkStat value="128" label="Jugadas" />
            <DkStat value="61%" label="Win rate" tone="pos" />
            <DkStat value="1608" label="ELO" tone="accent" />
            <DkStat value="4D" label="Racha" tone="neg" />
          </div>
        </Sample>
        <Sample title="Split V/D" code="<DkSplit win loss draw>" col>
          <div className="grid w-[17.5rem] gap-2">
            <DkSplit win={14} loss={6} />
            <DkSplit win={5} loss={9} draw={2} />
          </div>
        </Sample>
        <Sample title="Estado y frescura" code="<DkLive status> · <DkUpdated live>">
          <DkLive status="live" />
          <DkLive status="playing" />
          <DkLive status="pending" />
          <DkLive status="final" />
          <DkLive status="soon" />
          <DkUpdated updatedAt={Date.now() - 14000} live onRefresh={() => {}} />
        </Sample>
      </Section>

      <Section id="dkgraficas" kicker="Datos en vivo" title="Gráficas" lead={<>Línea de progresión con base punteada y puntos por resultado, lista con barras proporcionales y rejilla de intensidad para actividad.</>}>
        <Sample title="Progresión" code="<DkTrend lines baseline dots>" col>
          <div className="w-full max-w-[35rem]">
            <DkTrend height={150} baseline={1500} lines={[{ values: ELO, color: "var(--accent)", width: 2, dots: RESULTS }]} />
          </div>
        </Sample>
        <Sample title="Lista con barras" code="<DkBarList items>" col>
          <div className="w-full max-w-[26.25rem]">
            <DkBarList
              items={[
                { name: "Protección", pct: 82.4 },
                { name: "Lanzallamas", pct: 64.1 },
                { name: "Golpe Bajo", pct: 51.9 },
                { name: "Terremoto", pct: 33.2 },
              ]}
            />
          </div>
        </Sample>
        <Sample title="Actividad" code="<DkHeat rows cols value>" col>
          <div className="w-full max-w-[35rem]">
            <DkHeat rows={["Lun", "Mié", "Vie", "Dom"]} cols={Array.from({ length: 24 }, (_, i) => (i % 6 === 0 ? i + "h" : ""))} max={6} value={(r, c) => ((r * 7 + c * 3) % 11 > 6 ? ((r + c) % 6) + 1 : 0)} />
          </div>
        </Sample>
      </Section>

      <Section id="dkrondas" kicker="Datos en vivo" title="Rondas y cuadro" lead={<>Stepper de rondas suizas con estados (jugada / en vivo / pendiente) y el layout de cuadro de eliminación directa — el contenido de cada cruce lo pone el anfitrión.</>}>
        <Sample title="Stepper de rondas" code="<DkStepper steps value>" col>
          <DkStepper
            value={step}
            onChange={setStep}
            steps={[
              { value: "r1", label: "R1", status: "done" },
              { value: "r2", label: "R2", status: "done" },
              { value: "r3", label: "R3", status: "done" },
              { value: "r4", label: "R4", status: "done" },
              { value: "r5", label: "R5", status: "live" },
              { value: "cut", label: "Top Cut", status: "pending" },
            ]}
          />
        </Sample>
      </Section>

      <Section id="dkestadosvivo" kicker="Datos en vivo" title="Carga, vacío y avisos" lead={<>Skeletons al cambiar de contexto, estado vacío con acción de recuperación y toast para acciones de demo.</>}>
        <Sample title="Skeleton" code="<DkSkelList rows h>" col>
          <div className="w-full max-w-[26.25rem]">
            <DkSkelList rows={4} h={38} />
          </div>
        </Sample>
        <Sample title="Vacío" code="<DkEmpty icon title lead>" col>
          <div className="w-full max-w-[30rem]">
            <DkEmpty icon="search" title="Sin resultados" lead="Ningún jugador coincide con el filtro actual.">
              <Button size="sm">Limpiar filtros</Button>
            </DkEmpty>
          </div>
        </Sample>
        <Sample title="Toast" code="useDkToast()">
          <ToastDemo />
        </Sample>
      </Section>
    </>
  )
}
