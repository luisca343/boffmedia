"use client"

import * as React from "react"
import {
  Avatar,
  Button,
  CardSkeleton,
  Check,
  Chip,
  I,
  LivePill,
  PillBtn,
  PulseDot,
  SectionHeader,
  Skeleton,
  Tag,
  Toggle,
} from "@/components/smartrotom/media/ui"
import { Sample, Section } from "../showcase-shared"
import { MW_FACES } from "./mw-demo"

function ButtonRow() {
  return (
    <>
      <Button variant="solid" size="md">
        <I.plus size={16} /> Suscribirse
      </Button>
      <Button variant="ghost" size="md">
        <I.bell size={16} /> Notificar
      </Button>
      <Button variant="plain" size="md">
        <I.share size={16} /> Compartir
      </Button>
    </>
  )
}

function ChipRow({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  return (
    <>
      {["Todo", "Directos", "VGC", "Nuzlocke"].map((c) => (
        <Chip key={c} active={value === c} onClick={() => onPick(c)}>
          {c}
        </Chip>
      ))}
    </>
  )
}

export function MwPrimitivasChapter() {
  const [tubeChip, setTubeChip] = React.useState("VGC")
  const [twitchChip, setTwitchChip] = React.useState("Directos")
  const [rail, setRail] = React.useState("Para ti")
  const [autoplay, setAutoplay] = React.useState(true)
  const [notify, setNotify] = React.useState(false)

  return (
    <>
      <Section
        id="mw-botones"
        kicker="Media"
        title="Botones"
        lead={
          <>
            Dos familias: <code>Button</code> (sólido con degradado de acento, fantasma de cristal teñido y plano
            neutro) y <code>PillBtn</code>, la píldora de barra de acción con estado <code>active</code>. Ninguno
            recibe la app como prop — el degradado y el tinte se derivan de <code>--mw-accent</code>.
          </>
        }
      >
        <Sample app="mw" media="mewtube" title="Button · Mewtube" code="solid · ghost · plain">
          <ButtonRow />
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="Button · Mewtwitch"
          code="solid · ghost · plain"
          note="El mismo marcado, el mismo componente: solo cambia data-app en la raíz."
        >
          <ButtonRow />
        </Sample>

        <Sample app="mw" media="mewtube" title="Tamaños" code="sm · md · lg">
          <Button variant="solid" size="sm">
            Pequeño
          </Button>
          <Button variant="solid" size="md">
            Medio
          </Button>
          <Button variant="solid" size="lg">
            Grande
          </Button>
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="PillBtn"
          code="active · iconOnly"
          note={
            <>
              <code>PillBtn</code> acepta <code>href</code> y entonces renderiza un <code>Link</code>; sin él es un{" "}
              <code>button</code>. Los iconos salen del registro <code>I</code>, nunca de un nombre de clase dinámico.
            </>
          }
        >
          <PillBtn active>
            <I.flame size={16} /> Siguiendo
          </PillBtn>
          <PillBtn>
            <I.compass size={16} /> Explorar
          </PillBtn>
          <PillBtn iconOnly aria-label="Ajustes">
            <I.cog size={16} />
          </PillBtn>
          <PillBtn iconOnly aria-label="Notificaciones">
            <I.bell size={16} />
          </PillBtn>
        </Sample>
      </Section>

      <Section
        id="mw-chips"
        kicker="Media"
        title="Chips y etiquetas"
        lead={
          <>
            <code>Chip</code> es un filtro pulsable con dos formas de activarse: <code>tone=&quot;accent&quot;</code>{" "}
            (tinte de acento, filas de filtros) y <code>tone=&quot;solid&quot;</code> (relleno blanco, el raíl de
            descubrimiento). <code>Tag</code> es de solo lectura salvo que reciba <code>href</code>.
          </>
        }
      >
        <Sample app="mw" media="mewtube" title="Chip · filtros" code='tone="accent"'>
          <ChipRow value={tubeChip} onPick={setTubeChip} />
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="Chip · filtros"
          code='tone="accent"'
          note="El chip activo se tiñe con el acento de la app; el inactivo vive en la rampa neutra."
        >
          <ChipRow value={twitchChip} onPick={setTwitchChip} />
        </Sample>

        <Sample app="mw" media="mewtwitch" title="Chip · raíl" code='tone="solid"'>
          {["Para ti", "Directos", "Categorías", "Siguiendo"].map((c) => (
            <Chip key={c} tone="solid" active={rail === c} onClick={() => setRail(c)}>
              {c}
            </Chip>
          ))}
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="Tag"
          code="<Tag> · <Tag href>"
          note="Las etiquetas de un directo son informativas; con href pasan a ser navegación a la búsqueda por etiqueta."
        >
          <Tag>Español</Tag>
          <Tag>Sin spoilers</Tag>
          <Tag href="#">VGC</Tag>
        </Sample>
      </Section>

      <Section
        id="mw-directo"
        kicker="Media"
        title="Directo"
        lead={
          <>
            Las dos señales de retransmisión. <code>LivePill</code> siempre lleva la palabra «EN VIVO» además del
            color: el significado nunca es solo cromático. <code>PulseDot</code> acompaña a un contador de
            espectadores, jamás va suelto.
          </>
        }
      >
        <Sample app="mw" media="mewtwitch" title="LivePill" code="size · label">
          <LivePill />
          <LivePill size="lg" />
          <LivePill size="lg" label="Reestreno" />
        </Sample>

        <Sample
          app="mw"
          media="mewtube"
          title="LivePill · Mewtube"
          code="size · label"
          note="Mewtube también retransmite en directo: la píldora es la misma pieza, con el acento de su app."
        >
          <LivePill />
          <LivePill size="lg" />
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="PulseDot"
          code="<PulseDot />"
          note="El punto es decorativo; el número que lo acompaña es el dato accesible."
        >
          <span className="inline-flex items-center gap-1.5 rounded-mw-sm border border-mw-line-strong bg-black/75 px-2 py-[3px] font-mono text-[11px] font-bold text-white">
            <PulseDot /> 12 480
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-mw-fg-mute">
            <PulseDot /> 4 canales que sigues están en directo
          </span>
        </Sample>
      </Section>

      <Section
        id="mw-controles"
        kicker="Media"
        title="Avatar y controles"
        lead={
          <>
            <code>Avatar</code> es la única fuente de verdad para las caras: foto con reserva de iniciales, anillo de
            acento para canales en directo y una ranura <code>children</code> para superponer insignias.{" "}
            <code>Check</code>, <code>Toggle</code> y <code>SectionHeader</code> completan el juego de controles.
          </>
        }
      >
        <Sample app="mw" media="mewtwitch" title="Avatar" code="src · name · size · ring">
          <Avatar name="Enfermera Joy" />
          <Avatar src={MW_FACES.joy} name="Enfermera Joy" />
          <Avatar src={MW_FACES.brock} name="Brock" size="lg" ring />
          <Avatar src={MW_FACES.rotom} name="Rotom Analiza" size={72} ring>
            <LivePill className="absolute -bottom-1 left-1/2 -translate-x-1/2" />
          </Avatar>
        </Sample>

        <Sample
          app="mw"
          media="mewtube"
          title="Avatar · Mewtube"
          code="ring"
          note="El anillo se dibuja con box-shadow sobre el acento, así que hereda la app sin ninguna prop de plataforma."
        >
          <Avatar src={MW_FACES.oak} name="Profesor Oak" size="lg" ring />
          <Avatar name="Sin foto" size="lg" />
          <span className="inline-flex items-center gap-1 text-[13px] text-mw-fg-mute">
            Profesor Oak <Check /> verificado
          </span>
        </Sample>

        <Sample app="mw" media="mewtube" title="Check y Toggle" code='size="sm" · "lg" · role="switch"'>
          <Check />
          <Check size="lg" />
          <label className="inline-flex items-center gap-2 text-[13px] text-mw-fg-mute">
            <Toggle checked={autoplay} onChange={setAutoplay} label="Reproducción automática" />
            Reproducción automática
          </label>
          <label className="inline-flex items-center gap-2 text-[13px] text-mw-fg-mute">
            <Toggle checked={notify} onChange={setNotify} label="Avisarme al empezar" />
            Avisarme al empezar
          </label>
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="SectionHeader"
          code="eyebrow · title · subtitle · action · rule"
          col
          note={
            <>
              La barra izquierda, la píldora de arriba y el subrayado usan <code>bg-mw-accent</code>: la cabecera es la
              misma en las dos apps y se recolorea sola.
            </>
          }
        >
          <SectionHeader
            eyebrow={
              <>
                <I.live size={12} /> En directo
              </>
            }
            title="Canales que sigues"
            subtitle="4 de 26 canales están emitiendo ahora"
            action={
              <Button variant="ghost" size="sm">
                Ver todo <I.chevron size={14} />
              </Button>
            }
            rule={false}
          />
          <SectionHeader title="Categorías populares" />
        </Sample>
      </Section>

      <Section
        id="mw-estados"
        kicker="Media"
        title="Carga"
        lead={
          <>
            <code>Skeleton</code> es una forma vacía a la que das medidas con utilidades. <code>CardSkeleton</code> ya
            replica la silueta de <code>VideoCard</code>/<code>StreamCard</code> (16:9 + avatar + tres líneas), así que
            la rejilla no salta cuando llegan los datos.
          </>
        }
      >
        <Sample app="mw" media="mewtube" title="Skeleton" code="h-* · w-* · aspect-*" col>
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-24 w-full rounded-mw-xl" />
          </div>
        </Sample>

        <Sample app="mw" media="mewtube" title="CardSkeleton · Mewtube" code="<CardSkeleton />" grid>
          <CardSkeleton />
          <CardSkeleton />
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="CardSkeleton · Mewtwitch"
          code="<CardSkeleton />"
          grid
          note="El esqueleto es neutro a propósito: la rampa de superficie ya lo diferencia, no necesita acento."
        >
          <CardSkeleton />
          <CardSkeleton />
        </Sample>
      </Section>
    </>
  )
}
