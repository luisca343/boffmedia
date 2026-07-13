"use client"

import * as React from "react"
import {
  Bar,
  Button,
  Chip,
  ChipButton,
  Icon,
  Input,
  Kbd,
  Panel,
  Select,
  Skeleton,
  Switch,
  hpTone,
  statTone,
} from "@/app/smartrotom/pc/_components/ui"
import { Sample, Section } from "../showcase-shared"

export function PcPrimitivasChapter() {
  const [on, setOn] = React.useState(true)

  return (
    <>
      <Section
        id="pc-botones"
        kicker="PC"
        title="Botones"
        lead="Cuatro variantes. La primaria es el único degradado de la app y se reserva para la acción que cierra un flujo (Aplicar, Reintentar); todo lo demás es cristal."
      >
        <Sample title="Variantes" code='<Button variant="primary" | "default" | "ghost" | "danger" />' app="pc">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="primary">
              <Icon name="check" size={15} /> Aplicar
            </Button>
            <Button>
              <Icon name="boxes" size={15} /> Mover a…
            </Button>
            <Button variant="ghost">Deseleccionar</Button>
            <Button variant="danger">
              <Icon name="trash" size={15} /> Destructivo
            </Button>
            <Button disabled>Desactivado</Button>
          </div>
        </Sample>

        <Sample
          title="Icono y estado encendido"
          code='<Button icon active aria-label="…" />'
          app="pc"
          note="Un botón solo-icono SIEMPRE lleva `aria-label`. El estado `active` es el que usa la barra superior para los modos que se quedan encendidos —doble caja, selección múltiple—."
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <Button icon aria-label="Filtros">
              <Icon name="sliders" size={17} />
            </Button>
            <Button icon active aria-label="Doble caja">
              <Icon name="columns" size={17} />
            </Button>
            <Button icon active className="border-pc-cyan bg-pc-cyan/[.16] text-pc-cyan" aria-label="Selección múltiple">
              <Icon name="check" size={17} />
            </Button>
            <Button icon variant="ghost" aria-label="Cerrar">
              <Icon name="x" size={18} />
            </Button>
          </div>
        </Sample>
      </Section>

      <Section
        id="pc-etiquetas"
        kicker="PC"
        title="Etiquetas"
        lead="Chips para lo que se lee, chips-botón para lo que se pulsa."
      >
        <Sample title="Chip y ChipButton" code="<Chip /> · <ChipButton active />" app="pc">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>Nv 100</Chip>
            <Chip className="border-pc-violet text-pc-violet">
              <Icon name="zap" size={11} /> Legend.
            </Chip>
            <Chip className="font-pc-mono">⌘K</Chip>
            <ChipButton active>
              <Icon name="sparkles" size={12} className="text-pc-gold" /> Todos los Shiny
            </ChipButton>
            <ChipButton>
              <Icon name="heart" size={12} className="text-pc-rose" /> Favoritos
            </ChipButton>
            <ChipButton className="border-dashed">
              <Icon name="bookmark" size={12} /> Guardar vista
            </ChipButton>
          </div>
        </Sample>
      </Section>

      <Section
        id="pc-campos"
        kicker="PC"
        title="Campos"
        lead="Un único pozo hundido, compartido por input, select y textarea, para que un rango de nivel y un código de compartir parezcan el mismo control."
      >
        <Sample title="Input · Select · Switch · Kbd" code="<Input /> · <Select /> · <Switch /> · <Kbd />" app="pc">
          <div className="flex max-w-md flex-col gap-3">
            <div className="relative">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pc-fg-subtle"
              />
              <Input placeholder="Buscar por nombre o número…" className="pl-9" />
            </div>
            <Select defaultValue="box">
              <option value="box">Caja</option>
              <option value="level">Nivel</option>
              <option value="iv">IV total</option>
            </Select>
            <div className="flex items-center gap-3">
              <Switch checked={on} onChange={setOn} label="Sonido" />
              <span className="text-[13px] text-pc-fg-muted">Sonido</span>
              <span className="ml-auto flex items-center gap-1.5 text-[12px] text-pc-fg-subtle">
                Pulsa <Kbd>/</Kbd> para buscar
              </span>
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="pc-medidores"
        kicker="PC"
        title="Medidores"
        lead="Una sola barra sirve para todo: lo lleno que está una caja, los PS de un miembro del equipo, una estadística, el progreso de la Pokédex. Lo que cambia es el tono, y el tono siempre es un dato."
      >
        <Sample
          title="Bar · statTone · hpTone"
          code="<Bar pct={n} tone={statTone(v)} />"
          app="pc"
          note="El tono se pasa como valor en línea, no como clase: sale de un número (una estadística, unos PS, cuántos Pokémon caben en la caja), y una clase interpolada no compilaría."
        >
          <div className="flex max-w-md flex-col gap-3">
            {[
              ["Atq", 134],
              ["Def", 95],
              ["Vel", 72],
              ["AtE", 48],
            ].map(([label, v]) => (
              <div key={label as string} className="flex items-center gap-2.5">
                <span className="w-9 font-pc-mono text-[11px] text-pc-fg-subtle">{label}</span>
                <span className="w-9 text-right font-pc-mono text-[12.5px] font-bold">{v}</span>
                <Bar pct={((v as number) / 200) * 100} tone={statTone(v as number)} className="flex-1" />
              </div>
            ))}
            <div className="mt-1 flex items-center gap-2.5">
              <span className="w-[72px] text-[12px] text-pc-fg-muted">PS</span>
              <Bar pct={38} tone={hpTone(0.38)} height={5} className="flex-1" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-[72px] text-[12px] text-pc-fg-muted">Pokédex</span>
              <Bar
                pct={62}
                tone="linear-gradient(90deg, rgb(var(--pc-accent)), rgb(var(--pc-cyan)))"
                height={7}
                className="flex-1"
              />
            </div>
          </div>
        </Sample>
      </Section>

      <Section id="pc-estados" kicker="PC" title="Carga" lead="Cristal, y dentro el brillo que barre.">
        <Sample title="Panel + Skeleton" code="<Panel /> · <Skeleton />" app="pc">
          <Panel className="w-full max-w-sm p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-pc-sm" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-6 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </Panel>
        </Sample>
      </Section>
    </>
  )
}
