"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  Avatar,
  Button,
  Card,
  CardFlat,
  Chip,
  Divider,
  EmptyState,
  Input,
  MetaInput,
  Meta,
  Pill,
  Select,
  Skeleton,
  Stat,
  Tag,
  Textarea,
  Toggle,
} from "../../../furrettoday/_components/ui"

export function FtPrimitivasChapter() {
  const [active, setActive] = React.useState("meta")
  const [published, setPublished] = React.useState(true)
  const [featured, setFeatured] = React.useState(false)

  return (
    <>
      <Section
        id="ft-botones"
        kicker="Furret Today"
        title="Botones"
        lead="Contorno de tinta, sombra dura y, al pasar por encima, la losa entera se desplaza arriba-izquierda mientras la sombra crece: como si la levantaras del papel."
      >
        <Sample
          title="Variantes"
          code='variant="default" | "primary" | "ink" | "cyan" | "ghost"'
          app="ft"
          note="`ghost` es la única que no se levanta — no tiene sombra que crecer."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>Leer →</Button>
            <Button variant="primary">Suscribirme</Button>
            <Button variant="ink">Guardar</Button>
            <Button variant="cyan">Compartir</Button>
            <Button variant="ghost">← Portada</Button>
            <Button disabled>Sin cambios</Button>
          </div>
        </Sample>

        <Sample title="Tamaños" code='size="sm" | "md" | "lg"' app="ft">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Pequeño</Button>
            <Button size="md">Mediano</Button>
            <Button variant="primary" size="lg">
              Leer la portada →
            </Button>
          </div>
        </Sample>
      </Section>

      <Section
        id="ft-etiquetas"
        kicker="Furret Today"
        title="Etiquetas"
        lead="La píldora es el antetítulo que va encima de toda portada; el chip filtra secciones. Ambos reciben el tono como DATO, así que salen de mapas literales de clase, nunca de una plantilla."
      >
        <Sample
          title="Píldoras"
          code='tone={FtAccent | "ink" | "paper"} · live'
          app="ft"
          note="`paper` lleva borde porque, sin él, desaparecería sobre el papel."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="ink">Portada</Pill>
            <Pill tone="pink">Meta</Pill>
            <Pill tone="cyan">Comunidad</Pill>
            <Pill tone="yellow">Filtración</Pill>
            <Pill tone="purple">Torneos</Pill>
            <Pill tone="orange">Fan Art</Pill>
            <Pill tone="lime">Guías</Pill>
            <Pill tone="paper">17 · MAY</Pill>
            <Pill tone="pink" live>
              En directo
            </Pill>
          </div>
        </Sample>

        <Sample
          title="Chips y tags"
          code="Chip active · Tag"
          app="ft"
          note="El `Chip` filtra (es un botón, lleva `aria-pressed`); el `Tag` sólo etiqueta."
        >
          <div className="flex flex-wrap items-center gap-2">
            {["meta", "comunidad", "torneos", "guías"].map((c) => (
              <Chip key={c} active={active === c} onClick={() => setActive(c)}>
                {c}
              </Chip>
            ))}
            <Tag>#furret</Tag>
            <Tag>#competitivo</Tag>
          </div>
        </Sample>
      </Section>

      <Section
        id="ft-tarjetas"
        kicker="Furret Today"
        title="Tarjetas"
        lead="Dos pesos: la tarjeta de revista (radio grande, sombra dura, se levanta) y la plana (más apretada, sin sombra) para los módulos de la barra lateral."
      >
        <Sample title="Card · CardFlat" code="Card lift · CardFlat · Divider" app="ft">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card lift className="p-5">
              <div className="font-ft-display text-2xl leading-none">Card lift</div>
              <p className="font-ft-deck mt-1 text-base italic text-ft-deck">
                Se levanta al pasar por encima.
              </p>
            </Card>
            <CardFlat className="p-5">
              <div className="font-ft-display text-2xl leading-none">CardFlat</div>
              <Divider />
              <Meta>Sin sombra · barra lateral</Meta>
            </CardFlat>
          </div>
        </Sample>

        <Sample
          title="Avatares"
          code="Avatar name size"
          app="ft"
          note="El color se calcula con un hash del nombre, así que la misma persona sale siempre del mismo color — vía los mapas literales, nunca una clase interpolada."
        >
          <div className="flex items-center gap-3">
            <Avatar name="Lúa Caminante" size={56} />
            <Avatar name="Iván Greninja" size={56} />
            <Avatar name="Marisol Cyndaquil" size={56} />
            <Avatar name="Nidotina" size={56} />
          </div>
        </Sample>
      </Section>

      <Section
        id="ft-controles"
        kicker="Furret Today"
        title="Controles"
        lead="Los campos son píldoras con sombra dura. El interruptor del editor es una casilla real dibujada como pastilla sellada: el `input` sigue en el DOM (oculto visualmente, no `display:none`) para que se pueda tabular y se anuncie."
      >
        <Sample
          title="Campos"
          code="Input · Textarea · Select · MetaInput"
          app="ft"
          note="`MetaInput` es la versión con esquinas: una rejilla de ocho píldoras se leería como un montón de pastillas."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Buscar en el número…" />
            <Select defaultValue="recientes">
              <option value="recientes">Más recientes</option>
              <option value="leidos">Más leídos</option>
            </Select>
            <Textarea placeholder="Una frase: qué cuentas." rows={2} />
            <MetaInput placeholder="Autor/a" />
          </div>
        </Sample>

        <Sample title="Interruptores y cifras" code="Toggle · Stat" app="ft">
          <div className="flex flex-wrap items-center gap-4">
            <Toggle
              checked={published}
              label="Publicada"
              tone="cyan"
              onChange={() => setPublished((v) => !v)}
            />
            <Toggle
              checked={featured}
              label="Destacada"
              tone="pink"
              onChange={() => setFeatured((v) => !v)}
            />
            <div className="flex gap-2">
              <Stat label="Total" value={11} tone="cyan" />
              <Stat label="Public." value={7} tone="lime" />
              <Stat label="Destac." value={1} tone="pink" />
              <Stat label="Borrad." value={4} tone="yellow" />
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="ft-estados"
        kicker="Furret Today"
        title="Carga y vacíos"
        lead="Furret carga el número y Furret te dice cuando no hay nada. El esqueleto también lleva contorno de tinta: incluso vacío, el papel está impreso."
      >
        <Sample title="Esqueleto" code="Skeleton · ft-skel" app="ft">
          <div className="grid gap-3">
            <Skeleton className="h-[11.25rem] w-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </Sample>

        <Sample
          title="Vacío"
          code="EmptyState title message actionLabel onAction"
          app="ft"
          note="Nunca se rellena un hueco con datos falsos: si la API no lo tiene, aquí no hay nada que enseñar (§9)."
        >
          <EmptyState
            title="¡VAYA, NADA!"
            message="Furret ha buscado por todo el número y no encuentra nada con esos filtros."
            actionLabel="Reiniciar búsqueda"
            onAction={() => undefined}
          />
        </Sample>
      </Section>
    </>
  )
}
