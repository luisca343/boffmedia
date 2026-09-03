"use client"

import * as React from "react"
import {
  Button,
  Corners,
  Icon,
  Input,
  Panel,
  ProgressBar,
  Ring,
  SectionTitle,
  Segmented,
  Skeleton,
  StatCard,
  Switch,
  Tag,
} from "@/app/smartrotom/arcade/_components/ui"
import { Sample, Section } from "../showcase-shared"

function Controls() {
  const [on, setOn] = React.useState(true)
  const [scan, setScan] = React.useState<"off" | "subtle" | "strong">("subtle")
  return (
    <>
      <Switch on={on} onToggle={() => setOn(!on)} label="Efectos de sonido" />
      <Segmented
        label="Intensidad de scanlines"
        value={scan}
        onChange={setScan}
        options={[
          { value: "off", label: "Off" },
          { value: "subtle", label: "Sutil" },
          { value: "strong", label: "Intenso" },
        ]}
      />
      <div className="w-[13.75rem]">
        <Input placeholder="Adivina la criatura…" aria-label="Búsqueda de ejemplo" />
      </div>
    </>
  )
}

export function ArPrimitivasChapter() {
  return (
    <>
      <Section
        id="ar-botones"
        kicker="Arcade"
        title="Botones"
        lead="Cada botón relleno es un pulsador de plástico iluminado: degradado de arriba abajo, bisel blanco en el canto superior, bisel oscuro en el inferior y un halo de color debajo. `ar-lift` les da el tacto —suben un píxel al pasar por encima, bajan uno al pulsar—."
      >
        <Sample title="Variantes" code="<Button variant size icon />" app="ar">
          <Button variant="primary" icon={<Icon.Joystick s={14} />}>
            Jugar
          </Button>
          <Button variant="cyan" icon={<Icon.Sparkle s={14} />}>
            Reclamar
          </Button>
          <Button variant="amber" icon={<Icon.Coin s={14} />}>
            Abrir caja
          </Button>
          <Button variant="outline" icon={<Icon.Trophy s={14} />}>
            Recompensas
          </Button>
          <Button variant="ghost" icon={<Icon.Reset s={14} />}>
            Reiniciar
          </Button>
          <Button variant="danger" icon={<Icon.X s={14} />}>
            Abandonar
          </Button>
        </Sample>

        <Sample
          title="Tamaños y estados"
          code="size=sm|md|lg · disabled"
          app="ar"
          note="`ghost` es la única variante sin versalita ni tracking: es el botón que no quiere que lo mires."
        >
          <Button variant="cyan" size="sm">
            Pequeño
          </Button>
          <Button variant="cyan" size="md">
            Medio
          </Button>
          <Button variant="cyan" size="lg">
            Grande
          </Button>
          <Button variant="primary" disabled>
            Sin cajas
          </Button>
        </Sample>
      </Section>

      <Section
        id="ar-etiquetas"
        kicker="Arcade"
        title="Etiquetas"
        lead="Mono, versalita, muy espaciada, en un marco de neón translúcido. El tono dice qué es: cian sistema, magenta en vivo, violeta raro, ámbar premio, lima confirmado."
      >
        <Sample title="Tonos" code="<Tag tone size />" app="ar">
          <Tag tone="cyan">Nuevo</Tag>
          <Tag tone="magenta">Hot</Tag>
          <Tag tone="violet">Épico</Tag>
          <Tag tone="amber">Legendario</Tag>
          <Tag tone="lime">Reclamado</Tag>
          <Tag tone="ghost">Bloqueado</Tag>
        </Sample>

        <Sample title="Tamaños y con icono" code="size=sm|md|lg" app="ar">
          <Tag tone="cyan" size="sm">
            sm
          </Tag>
          <Tag tone="cyan" size="md">
            md
          </Tag>
          <Tag tone="cyan" size="lg">
            lg
          </Tag>
          <Tag tone="violet" size="md">
            <Icon.Box s={13} /> 3 cajas
          </Tag>
          <Tag tone="lime" size="md">
            <Icon.Shield s={13} /> Día 4 reclamado
          </Tag>
        </Sample>
      </Section>

      <Section
        id="ar-paneles"
        kicker="Arcade"
        title="Paneles"
        lead="El panel es la unidad de superficie: un cristal oscuro en un marco de neón, con las scanlines ya encima. El tono elige el neón del marco. `Corners` le pone las escuadras de punto de mira."
      >
        <Sample title="Tonos" code="<Panel tone tight glow />" app="ar" grid>
          <Panel tone="void">
            <div className="font-ar-display text-[0.625rem] uppercase tracking-[0.18em] text-ar-cyan">void</div>
            <p className="mt-2 font-ar text-xs text-ar-ink-dim">El panel por defecto.</p>
          </Panel>
          <Panel tone="deep">
            <div className="font-ar-display text-[0.625rem] uppercase tracking-[0.18em] text-ar-violet-2">deep</div>
            <p className="mt-2 font-ar text-xs text-ar-ink-dim">Para lo que va dentro de otro panel.</p>
          </Panel>
          <Panel tone="cyan">
            <div className="font-ar-display text-[0.625rem] uppercase tracking-[0.18em] text-ar-cyan">cyan</div>
            <p className="mt-2 font-ar text-xs text-ar-ink-dim">Héroe, marcador, sistema.</p>
          </Panel>
          <Panel tone="magenta">
            <div className="font-ar-display text-[0.625rem] uppercase tracking-[0.18em] text-ar-magenta-2">magenta</div>
            <p className="mt-2 font-ar text-xs text-ar-ink-dim">Inventario, botín, lo que está vivo.</p>
          </Panel>
        </Sample>

        <Sample
          title="Escuadras y cabecera"
          code="<Corners /> · <SectionTitle />"
          app="ar"
          col
          note="`Corners` va en un padre `relative` —todo `Panel` lo es— y es decorativo: nunca entra en el árbol de accesibilidad."
        >
          <Panel tone="void" className="relative w-full">
            <Corners tone="cyan" inset={10} size={14} />
            <SectionTitle
              kicker="Librería · 6 juegos"
              title="Juegos Arcade"
              accent="cyan"
              right={<Tag tone="cyan">Todos</Tag>}
            />
            <p className="font-ar text-xs text-ar-ink-dim">
              El título de sección: rótulo píxel arriba, titular píxel debajo, controles a la derecha.
            </p>
          </Panel>
        </Sample>
      </Section>

      <Section
        id="ar-controles"
        kicker="Arcade"
        title="Controles"
        lead="Interruptor, segmentado y campo. Los tres viven en Ajustes y en los juegos; los tres son `ar-lift`."
      >
        <Sample title="Switch, segmentado y campo" code="<Switch /> <Segmented /> <Input />" app="ar">
          <Controls />
        </Sample>
      </Section>

      <Section
        id="ar-progreso"
        kicker="Arcade"
        title="Progreso y cifras"
        lead="Barra, anillo y tarjeta de dato. Toda cifra va en mono tabular: en un marcador, los números no deben bailar al cambiar."
      >
        <Sample title="Barra" code="<ProgressBar value max tone height />" app="ar" col>
          <div className="grid w-full gap-3">
            <ProgressBar value={4} max={7} tone="cyan" label="Racha" />
            <ProgressBar value={70} max={100} tone="amber" label="Común" />
            <ProgressBar value={30} max={100} tone="violet" label="Épico" />
            <ProgressBar value={5} max={100} tone="magenta" label="Legendario" />
          </div>
        </Sample>

        <Sample
          title="Anillo y tarjetas"
          code="<Ring /> · <StatCard />"
          app="ar"
          note="El anillo del HUD marca el día de la racha, no un nivel: el arcade no tiene XP ni niveles (ver «Diferido»)."
        >
          <Ring label={4} value={4} max={7} title="Día de la racha" />
          <Ring label={7} value={7} max={7} tone="amber" title="Semana completa" />
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <StatCard
              kicker="Racha total"
              value={21}
              sub="días reclamados seguidos"
              tone="cyan"
              icon={<Icon.Trophy s={18} />}
            />
            <StatCard
              kicker="Cajas sin abrir"
              value={3}
              sub="en tu inventario"
              tone="violet"
              icon={<Icon.Box s={18} />}
            />
          </div>
        </Sample>
      </Section>

      <Section
        id="ar-estados"
        kicker="Arcade"
        title="Carga"
        lead="Un solo esqueleto, con el barrido apagado cuando el jugador reduce el movimiento."
      >
        <Sample title="Skeleton" code="<Skeleton className />" app="ar" col>
          <div className="grid w-full grid-cols-7 gap-2.5">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-[6.5rem]" />
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
