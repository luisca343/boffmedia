"use client"

import * as React from "react"
import {
  Button,
  Chip,
  Empty,
  Eyebrow,
  FilterChip,
  Icon,
  IconButton,
  Pill,
  ProgressBar,
  RegionTag,
  SearchBar,
  Skeleton,
  Stat,
  StatBox,
  Switch,
  toast,
} from "../../../taxi/_components/ui"
import { Sample, Section } from "../showcase-shared"

function SearchDemo() {
  const [q, setQ] = React.useState("")
  const [sort, setSort] = React.useState<"near" | "far">("near")
  return (
    <div className="w-full">
      <SearchBar value={q} onChange={setQ} sort={sort} onToggleSort={() => setSort(sort === "near" ? "far" : "near")} />
    </div>
  )
}

function FilterDemo() {
  const [region, setRegion] = React.useState("Todos")
  return (
    <>
      <FilterChip active={region === "Todos"} count={12} onClick={() => setRegion("Todos")}>
        Todos
      </FilterChip>
      <FilterChip active={region === "Ciudad Teras"} count={3} onClick={() => setRegion("Ciudad Teras")}>
        Ciudad Teras
      </FilterChip>
      <FilterChip active={region === "Costa"} count={2} onClick={() => setRegion("Costa")}>
        Costa
      </FilterChip>
    </>
  )
}

function ChipDemo() {
  const [on, setOn] = React.useState("Liga Teras")
  return (
    <>
      <Chip active={on === "Liga Teras"} onClick={() => setOn("Liga Teras")}>
        <Icon name="star" size={12} stroke={2.4} style={{ fill: "currentColor" }} className="text-tx-accent" />
        Liga Teras
      </Chip>
      <Chip active={on === "Puerto Wingull"} onClick={() => setOn("Puerto Wingull")}>
        <Icon name="pin" size={12} stroke={2.4} className="text-tx-blue-400" />
        Puerto Wingull
      </Chip>
    </>
  )
}

function SwitchDemo() {
  const [on, setOn] = React.useState(false)
  return (
    <button type="button" onClick={() => setOn((v) => !v)} className="flex items-center gap-3">
      <Switch on={on} />
      <span className="text-sm font-bold text-tx-txt">{on ? "Activado" : "Desactivado"}</span>
    </button>
  )
}

export function TxPrimitivasChapter() {
  return (
    <>
      <Section
        id="tx-botones"
        kicker="Primitivas"
        title="Botones"
        lead={
          <>
            Un solo <code>primary</code> por superficie, y siempre es el que gasta. <code>secondary</code> tiene
            la misma forma sin el cargo (recargar); <code>quiet</code> es la mitad callada de una fila de dos.
          </>
        }
      >
        <Sample title="Variantes" code="<Button variant>" app="tx" col>
          <div className="flex gap-[9px]">
            <Button variant="ghost" aria-label="Centrar en el mapa">
              <Icon name="crosshair" size={17} stroke={2} />
            </Button>
            <Button variant="primary">
              <Icon name="nav" size={17} stroke={2.4} />
              Viajar · 2.956 ¥
            </Button>
          </div>
          <div className="flex gap-[9px]">
            <Button variant="quiet" className="flex-[0_0_38%]">
              Cancelar
            </Button>
            <Button variant="secondary">
              <Icon name="wallet" size={17} stroke={2.2} />
              Recargar saldo
            </Button>
          </div>
          <Button variant="primary" disabled>
            <Icon name="nav" size={17} stroke={2.4} />
            Cobrando…
          </Button>
        </Sample>

        <Sample title="Iconos" code="<IconButton>" app="tx">
          <IconButton label="Cerrar">
            <Icon name="x" size={18} />
          </IconButton>
          <IconButton label="Centrar en ti">
            <Icon name="crosshair" size={18} stroke={2.2} />
          </IconButton>
          <IconButton label="Cartera">
            <Icon name="wallet" size={18} stroke={2.2} />
          </IconButton>
        </Sample>
      </Section>

      <Section
        id="tx-chips"
        kicker="Primitivas"
        title="Chips y píldoras"
        lead={
          <>
            <b>Chip</b> es un atajo a un destino y se pone ámbar al seleccionarse — es el mismo acto que tocar su
            chincheta. <b>FilterChip</b> es azul: filtrar es estructura, no gasto.
          </>
        }
      >
        <Sample title="Atajos de destino" code="<Chip active>" app="tx">
          <ChipDemo />
        </Sample>
        <Sample
          title="Filtros de región"
          code="<FilterChip count>"
          app="tx"
          note={
            <>
              Las regiones son reales: salen de los polígonos WorldGuard del mundo, resueltos por{" "}
              <code>regionForPoint</code>. El filtro sólo ofrece regiones en las que hay al menos una parada.
            </>
          }
        >
          <FilterDemo />
        </Sample>
        <Sample title="Píldoras de barra" code="<Pill tone> · <RegionTag>" app="tx">
          <Pill as="button" tone="money">
            <Icon name="coins" size={14} stroke={2.2} />
            9.240 ¥
            <span className="ml-px grid h-[17px] w-[17px] place-items-center rounded-full bg-tx-accent text-tx-on-accent">
              <Icon name="plus" size={11} stroke={3} />
            </span>
          </Pill>
          <Pill>
            <Icon name="nav" size={14} stroke={2.2} />
            Taxi de Teras
          </Pill>
          <RegionTag>Ciudad Teras</RegionTag>
        </Sample>
      </Section>

      <Section id="tx-formularios" kicker="Primitivas" title="Búsqueda y controles">
        <Sample title="Buscar y ordenar" code="<SearchBar>" app="tx" col>
          <SearchDemo />
        </Sample>
        <Sample title="Interruptor" code="<Switch on>" app="tx">
          <SwitchDemo />
        </Sample>
        <Sample title="Rótulo" code="<Eyebrow icon count>" app="tx" col>
          <Eyebrow icon="star">Favoritos</Eyebrow>
          <Eyebrow icon="map" count="7/12">
            Sellos del pasaporte
          </Eyebrow>
        </Sample>
      </Section>

      <Section
        id="tx-datos"
        kicker="Primitivas"
        title="Cifras"
        lead="Toda cifra es monoespaciada y tabular. Una tarifa que el jugador no puede pagar se pone roja, pero nunca deja de ser legible."
      >
        <Sample title="Estadística" code="<Stat tone>" app="tx" grid>
          <Stat icon="crosshair" label="Coords" value="1840, −2210" />
          <Stat icon="walking" label="Distancia" value="2.764 b" />
          <Stat icon="coins" label="Tarifa" value="1.482 ¥" tone="money" />
          <Stat icon="coins" label="Tarifa" value="9.912 ¥" tone="bad" />
        </Sample>
        <Sample title="Caja de estadística" code="<StatBox money>" app="tx" grid>
          <StatBox icon="map" value={7} suffix=" / 12" label="Destinos visitados" />
          <StatBox icon="coins" value="6.722" label="¥ en taxis" money />
        </Sample>
        <Sample title="Progreso" code="<ProgressBar pct>" app="tx" col>
          <ProgressBar pct={68} />
        </Sample>
      </Section>

      <Section id="tx-estados" kicker="Primitivas" title="Vacíos, carga y avisos">
        <Sample title="Vacío" code="<Empty>" app="tx" col>
          <Empty message="Ningún destino coincide con tu búsqueda." action="Ver todos" onAction={() => {}} />
        </Sample>
        <Sample title="Esqueleto" code="<Skeleton>" app="tx" col>
          <Skeleton className="h-[38px] w-[120px] rounded-tx-pill" />
          <Skeleton className="h-[104px] rounded-tx-md" />
        </Sample>
        <Sample
          title="Avisos"
          code="toast.info · success · error"
          app="tx"
          note="Los toasts se portalan fuera de `.tx-app`, así que ToastHost los reenvuelve en un ThemedLayer — si no, saldrían sin tokens (§2)."
        >
          <Button variant="quiet" onClick={() => toast.info("Añadido a favoritos")}>
            info
          </Button>
          <Button variant="quiet" onClick={() => toast.success("¡Has llegado a Liga Teras!")}>
            success
          </Button>
          <Button variant="quiet" onClick={() => toast.error("No se pudo cobrar el viaje")}>
            error
          </Button>
        </Sample>
      </Section>
    </>
  )
}
