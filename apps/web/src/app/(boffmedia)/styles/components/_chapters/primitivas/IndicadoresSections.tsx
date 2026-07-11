"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section } from "../../showcase-shared"
import { Badge, Button, Chip, Icon, IconButton, Kbd, Ring, Skeleton, Spinner, Tooltip } from "@/components/boffmedia/primitives"

export function IndicadoresSections({ rng }: { rng: number }) {
  return (
    <>
      <Section
        id="indicadores"
        kicker="Primitivas"
        title="Anillo y carga"
        lead={<><code>Ring</code> es el progreso radial (logros, colecciones); <code>Spinner</code> es la carga indeterminada; <code>Skeleton</code> es la base genérica de carga que cada herramienta especializa. Complementan al <code>Progress</code> lineal de «Selección y rango».</>}
      >
        <Sample title="Anillo de progreso" code="<Ring value size>">
          <Ring value={rng} size={92}>
            {rng}%
          </Ring>
          <Ring value={100} size={92}>
            <Icon name="check" size={26} />
          </Ring>
          <Ring value={38} size={72}>
            38%
          </Ring>
        </Sample>
        <Sample title="Spinner" code="<Spinner size>" note={<>Hereda <code>currentColor</code>, así que se tiñe según el contexto (aquí, naranja de acento). Con <code>reduce-motion</code> late en vez de girar. Es el mismo que sustituye la etiqueta de un <code>Button loading</code>.</>}>
          <Spinner size={16} />
          <Spinner size={22} />
          <Spinner size={30} className="text-accent" />
          <span className="inline-flex items-center gap-[10px] text-txt-muted text-[14px] ml-2">
            <Spinner size={14} /> Cargando datos…
          </span>
        </Sample>
        <Sample title="Skeleton" code="<Skeleton w h avatar>" col note={<>Se detiene con <code>reduce-motion</code>. Aquí, el esqueleto de una fila de jugador.</>}>
          <div className="flex gap-[14px] items-center w-full max-w-[420px]">
            <Skeleton w={48} h={48} avatar />
            <div className="flex-1 grid gap-2">
              <Skeleton w="60%" h={13} />
              <Skeleton w="92%" h={9} />
              <Skeleton w="40%" h={9} />
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="ayudas"
        kicker="Primitivas"
        title="Tooltip y teclas"
        lead={<>Ayuda contextual al pasar el cursor o enfocar (<code>Tooltip</code>) y teclas físicas (<code>Kbd</code>) para documentar atajos. El tooltip es solo texto — nunca lleva acciones dentro.</>}
      >
        <Sample title="Tooltip" code="<Tooltip label side>" note={<>Aparece con retardo en hover y foco de teclado; se coloca con <code>side</code>: top · bottom · left · right.</>}>
          <Tooltip label="Añadir al equipo">
            <Button size="sm" icon="plus">
              Pasa el cursor
            </Button>
          </Tooltip>
          <Tooltip label="Notificaciones" side="bottom">
            <IconButton name="bell" label="Notificaciones" />
          </Tooltip>
          <Tooltip label="Sincronizado hace 2 min" side="right">
            <Badge tone="ok">Activo</Badge>
          </Tooltip>
        </Sample>
        <Sample title="Teclas" code="<Kbd>">
          <span className="inline-flex gap-[6px] items-center">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
          <span className={cn(MONO_LABEL, "text-txt-dim normal-case tracking-[0.08em]")}>abre la paleta</span>
          <span className="inline-flex gap-[6px] items-center ml-[18px]">
            <Kbd>/</Kbd>
          </span>
          <span className={cn(MONO_LABEL, "text-txt-dim normal-case tracking-[0.08em]")}>busca en componentes</span>
        </Sample>
      </Section>

      <Section
        id="scrollbar"
        kicker="Primitivas"
        title="Scrollbar"
        lead={<>Sistema global con tokens <code>--sb-*</code>: pista transparente y pulgar rectangular que se aviva al pasar el ratón o mientras hay scroll activo, y se enciende en naranja al arrastrarlo. Funciona en WebKit y Firefox, respeta ambos temas y no necesita clases — para regiones internas usa la clase <code>bm-scroll</code>.</>}
      >
        <Sample title="Región vertical" code="overflow-y-auto · bm-scroll" col note={<>Haz scroll dentro: el pulgar se aviva mientras te desplazas y vuelve a apagarse al parar.</>}>
          <div className="bm-scroll max-h-[200px] w-full overflow-y-auto border border-solid border-line bg-panel" aria-label="Registro de cambios">
            {[
              ["v3.4", "Calculadora de daño: soporte de teracristal"],
              ["v3.3", "Clasificación: filtros por temporada"],
              ["v3.2", "Perfil: vitrina de logros"],
              ["v3.1", "Eventos: cuenta atrás en tarjetas"],
              ["v3.0", "Rediseño «Señal»: lanzamiento"],
              ["v2.9", "Foro: votos y menciones"],
              ["v2.8", "Calendario: vista mensual"],
              ["v2.7", "BattleSim: modo entrenamiento"],
            ].map(([v, t]) => (
              <div key={v} className="flex items-baseline gap-[14px] border-b border-solid border-line px-4 py-[11px] last:border-b-0">
                <span className={cn(MONO_LABEL, "text-accent")}>{v}</span>
                <span className="text-[14px] text-txt-muted">{t}</span>
              </div>
            ))}
          </div>
        </Sample>
        <Sample title="Región horizontal" code="overflow-x-auto · bm-scroll" col>
          <div className="bm-scroll w-full overflow-x-auto border border-solid border-line bg-panel px-4 pt-[14px] pb-[10px]" aria-label="Juegos">
            <div className="flex w-max gap-2">
              {["Pokémon VGC", "Minecraft", "Monster Hunter Wilds", "Pixelmon", "PMD: Sky", "Smash Ultimate", "Mario Kart", "Splatoon 3"].map((g) => (
                <Chip key={g}>{g}</Chip>
              ))}
            </div>
          </div>
        </Sample>
        <Sample title="Estados del pulgar" code="--sb-idle · --sb-hover · --sb-drag" col note={<>Los tres tonos van pegados en contraste para que el paso reposo → hover no resulte brusco.</>}>
          <div className="grid w-full max-w-[420px] gap-3">
            {[
              ["var(--sb-idle)", "Reposo — discreto sobre el contenido"],
              ["var(--sb-hover)", "Hover / scroll activo"],
              ["var(--sb-drag)", "Arrastre — señal naranja"],
            ].map(([c, l]) => (
              <div key={l} className="flex items-center gap-[14px]">
                <span className="h-1.5 w-16 flex-none" style={{ background: c }} />
                <span className={MONO_LABEL}>{l}</span>
              </div>
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
