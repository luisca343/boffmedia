"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { CtActivityRow, CtCover, CtGameCard, CtListCard, CtLogButton, CtRatingBars, CtStars, CtStatusPill, CT_STATUS_ORDER } from "@/components/boffmedia/ui/catalog"
import { CT_BY_ID, CT_DEMO_LIST, CT_GAMES } from "./catalogo-demo"
import { Badge, Button, Icon, PackCard, Progress, ServerStatus } from "@boffmedia/ui"

const noop = () => {}

export function CatalogoChapter() {
  const [rate, setRate] = React.useState(3.5)
  const [g1, g2, g3, g4] = CT_GAMES
  const listGames = CT_DEMO_LIST.ids.map((id) => CT_BY_ID[id]).filter(Boolean)

  return (
    <>
      <Section
        id="ctatoms"
        kicker="Catálogo"
        title="Nota, estado y registro"
        lead={
          <>
            Los átomos del backlog. <code>&lt;CtStars&gt;</code> muestra o edita una nota en <strong>medias estrellas</strong> (0,5–5); <code>&lt;CtStatusPill&gt;</code> etiqueta el estado con color propio; <code>&lt;CtLogButton&gt;</code> abre el selector de estado y refleja el actual. El estado <strong>Deseado ★</strong> es el mismo concepto que el seguidor del Calendario.
          </>
        }
      >
        <Sample title="Estrellas · display y edición" code="<CtStars value onChange size count>" col note="Sin <code>onChange</code> es de solo lectura y admite fracciones (4,5). Con <code>onChange</code>, diez medias zonas de click con previsualización al pasar el cursor.">
          <div className="flex flex-wrap items-center gap-[22px]">
            <CtStars value={4.5} size={20} count="92K" />
            <CtStars value={3} size={20} />
            <CtStars value={2.5} size={20} />
          </div>
          <div className="flex items-center gap-[14px]">
            <span className="font-mono text-[11px]/none font-semibold text-txt-muted">EDITABLE →</span>
            <CtStars value={rate} size={26} onChange={setRate} />
            <b className="font-mono text-[14px]/none font-bold text-accent">{rate || "—"}</b>
          </div>
        </Sample>
        <Sample title="Estados de seguimiento" code="<CtStatusPill status size solid>" col>
          <div className="flex flex-wrap gap-2">
            {CT_STATUS_ORDER.map((k) => (
              <CtStatusPill key={k} status={k} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {CT_STATUS_ORDER.map((k) => (
              <CtStatusPill key={k} status={k} solid />
            ))}
          </div>
        </Sample>
        <Sample title="Botón de registro" code="<CtLogButton gameId>" note="Abre un popover con los seis estados; al elegir, persiste en <code>CtStore</code> y todo lo que lea ese juego se actualiza.">
          <CtLogButton gameId={g1.id} />
          <CtLogButton gameId={g2.id} size="sm" />
        </Sample>
      </Section>

      <Section
        id="ctcover"
        kicker="Catálogo"
        title="Carátula y tarjeta"
        lead={
          <>
            <code>&lt;CtCover&gt;</code> es el póster-placeholder 2:3 (rayado + glifo de género + título). <code>&lt;CtGameCard&gt;</code> lo envuelve en tres variantes — <strong>póster</strong> (solo arte), <strong>cómoda</strong> (arte + título + nota) y <strong>fila</strong> — con la esquina de estado y tu nota superpuestas.
          </>
        }
      >
        <Sample title="Carátulas" code="<CtCover game>" col>
          <div className="grid w-full gap-3 [grid-template-columns:repeat(4,96px)]">
            {[g1, g2, g3, g4].map((g) => (
              <CtCover key={g.id} game={g} />
            ))}
          </div>
        </Sample>
        <Sample title="Tarjeta · cómoda y póster" code={`<CtGameCard variant="comoda|poster|fila">`} col note="Pasa el cursor por una tarjeta para ver el botón de registro emergente. El estado marcado aparece como sello en la esquina.">
          <div className="grid w-full grid-cols-2 gap-[14px] sm:grid-cols-4">
            {[g1, g2, g3, g4].map((g) => (
              <CtGameCard key={g.id} game={g} variant="comoda" onOpen={noop} />
            ))}
          </div>
        </Sample>
        <Sample title="Tarjeta · fila" code={`<CtGameCard variant="fila">`} col>
          <div className="grid w-full gap-2">
            <CtGameCard game={g1} variant="fila" onOpen={noop} />
            <CtGameCard game={g2} variant="fila" onOpen={noop} />
          </div>
        </Sample>
      </Section>

      <Section
        id="ctdist"
        kicker="Catálogo"
        title="Distribución, listas y actividad"
        lead={
          <>
            <code>&lt;CtRatingBars&gt;</code> pinta el histograma de notas de la comunidad (determinista por juego); <code>&lt;CtListCard&gt;</code> resume una colección con una pila de carátulas; <code>&lt;CtActivityRow&gt;</code> es la entrada del feed — usuario, acción, nota y reseña opcional.
          </>
        }
      >
        <Sample title="Histograma de notas" code="<CtRatingBars game height>" col>
          <div className="w-full max-w-[320px]">
            <CtRatingBars game={g1} height={72} />
          </div>
        </Sample>
        <Sample title="Tarjeta de lista" code="<CtListCard list games onOpen>" col>
          <div className="w-full max-w-[380px]">
            <CtListCard list={CT_DEMO_LIST} games={listGames} onOpen={noop} />
          </div>
        </Sample>
        <Sample title="Fila de actividad" code="<CtActivityRow item game onOpen>" col>
          <div className="w-full max-w-[640px]">
            <div className="flex flex-col">
              <CtActivityRow item={{ user: "marina_gg", gameId: g1.id, status: "played", rating: 5, review: "Una obra maestra. No he podido soltarlo.", time: "hace 2 h" }} game={g1} onOpen={noop} />
              <CtActivityRow item={{ user: "davidlvl99", gameId: g2.id, status: "playing", rating: 4.5, time: "hace 5 h" }} game={g2} onOpen={noop} />
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="packcard"
        kicker="Launcher"
        title="PackCard · estados"
        lead={
          <>
            <code>&lt;PackCard&gt;</code> muestra un paquete con arte de portada, estado, servidor y acciones. Aquí están los ocho estados principales del lanzador con sus variantes de icono y acción.
          </>
        }
      >
        <Sample title="Listo para jugar" code="PackCard · ready" col>
          <PackCard
            title="Minecraft: Java Edition"
            slug="minecraft-java"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge tone="ok">Listo</Badge>}
            badges={<span className="text-txt-muted text-[13px]">1.21.1</span>}
            footerMeta="Hace 2 días"
            actions={<Button variant="pri" size="sm" icon="play">Jugar</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Actualización disponible" code="PackCard · update" col>
          <PackCard
            title="Minecraft: Java Edition"
            slug="minecraft-java"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge tone="new">v2 lista</Badge>}
            badges={<span className="text-txt-muted text-[13px]">1.20.1 → 1.21.1</span>}
            actions={<Button variant="pri" size="sm" icon="refresh">Actualizar</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Instalando" code="PackCard · installing" col>
          <PackCard
            title="Minecraft: Java Edition"
            slug="minecraft-java"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge tone="live">Instalando</Badge>}
            progress={<Progress value={62} />}
            footerMeta="148/240 MB · 62%"
            actions={<Button variant="default" size="sm">Cancelar</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Sin acceso" code="PackCard · locked" col>
          <PackCard
            title="Servidor privado"
            slug="private-server"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge tone="bad">Sin acceso</Badge>}
            locked
            actions={<Button variant="pri" size="sm" icon="shield">Solicitar acceso</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Servidor en línea" code="PackCard · online" col>
          <PackCard
            title="Minecraft Multijugador"
            slug="mc-multi"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge tone="ok">Listo</Badge>}
            serverStatus={<ServerStatus status="online" label="Online · 24/60" address="play.boff.gg" />}
            actions={<Button variant="pri" size="sm">Jugar y conectar</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Servidor offline" code="PackCard · offline" col>
          <PackCard
            title="Minecraft Multijugador"
            slug="mc-multi"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge tone="ok">Listo</Badge>}
            serverStatus={<ServerStatus status="offline" label="Servidor offline" />}
            actions={<Button variant="default" size="sm">Jugar sin conectar</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Nunca jugado" code="PackCard · new" col>
          <PackCard
            title="Nueva colección"
            slug="new-pack"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge>Nuevo</Badge>}
            footerMeta="Nunca jugado"
            actions={<Button variant="pri" size="sm" icon="download">Instalar</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Con metadatos completos" code="PackCard · full-meta" col>
          <PackCard
            title="Fabricaciones avanzadas"
            slug="fabric-craft"
            icon={<Icon name="cube" size={24} />}
            stateBadge={<Badge tone="ok">Listo</Badge>}
            badges={<span className="text-txt-muted text-[13px]">1.21.1 · Fabric 0.16 · 1.4 GB · 487 archivos</span>}
            actions={<Button variant="pri" size="sm" icon="play">Jugar</Button>}
            className="w-full max-w-[320px]"
          />
        </Sample>
        <Sample title="Layout horizontal" code="PackCard · row layout" col>
          <div className="w-full max-w-[680px]">
            <PackCard
              title="Minecraft: Java Edition"
              slug="minecraft-java"
              icon={<Icon name="cube" size={24} />}
              layout="row"
              stateBadge={<Badge tone="ok">Listo</Badge>}
              badges={<span className="text-txt-muted text-[13px]">1.21.1</span>}
              footerMeta="Hace 2 días"
              actions={<Button variant="pri" size="sm" icon="play">Jugar</Button>}
            />
          </div>
        </Sample>
        <Sample title="Una tarjeta, tres vistas" code="PackCard · layout" col note="El mismo contenido renderizado en tres variantes: <code>layout=&quot;card&quot;</code> (portada estándar), <code>layout=&quot;compact&quot;</code> (sin arte, sello en cabecera) y <code>layout=&quot;row&quot;</code> (horizontal, 120px de arte). El cuerpo sigue el mismo orden: cabecera → resumen → servidor → progreso → error → línea de metadatos → pie.">
          <div className="flex flex-col gap-6 w-full max-w-[680px]">
            <PackCard
              title="Boff Vanilla (prueba)"
              slug="boff-vanilla-test"
              icon={<Icon name="cube" size={24} />}
              layout="card"
              stateBadge={<Badge tone="ok">Instalado</Badge>}
              summary="Minecraft 1.21.4 sin mods. Prueba mínima de instalación y arranque."
              serverStatus={<ServerStatus status="offline" label="Servidor offline" address="play.boff.gg" />}
              badges={<><span>Público</span><span className="text-txt">1.21.4</span><span>0 archivos</span><span>72 MB</span></>}
              footerMeta="Nunca jugado"
              actions={<Button variant="pri" size="sm" icon="play">Jugar</Button>}
              menu={<Button variant="ghost" size="sm" icon="more" aria-label="Más" />}
            />
            <PackCard
              title="Boff Vanilla (prueba)"
              slug="boff-vanilla-test"
              icon={<Icon name="cube" size={24} />}
              layout="compact"
              stateBadge={<Badge tone="ok">Instalado</Badge>}
              summary="Minecraft 1.21.4 sin mods. Prueba mínima de instalación y arranque."
              serverStatus={<ServerStatus status="offline" label="Servidor offline" address="play.boff.gg" />}
              badges={<><span>Público</span><span className="text-txt">1.21.4</span><span>0 archivos</span><span>72 MB</span></>}
              footerMeta="Nunca jugado"
              actions={<Button variant="pri" size="sm" icon="play">Jugar</Button>}
              menu={<Button variant="ghost" size="sm" icon="more" aria-label="Más" />}
            />
            <PackCard
              title="Boff Vanilla (prueba)"
              slug="boff-vanilla-test"
              icon={<Icon name="cube" size={24} />}
              layout="row"
              stateBadge={<Badge tone="ok">Instalado</Badge>}
              summary="Minecraft 1.21.4 sin mods. Prueba mínima de instalación y arranque."
              serverStatus={<ServerStatus status="offline" label="Servidor offline" address="play.boff.gg" />}
              badges={<><span>Público</span><span className="text-txt">1.21.4</span><span>0 archivos</span><span>72 MB</span></>}
              footerMeta="Nunca jugado"
              actions={<Button variant="pri" size="sm" icon="play">Jugar</Button>}
              menu={<Button variant="ghost" size="sm" icon="more" aria-label="Más" />}
            />
          </div>
        </Sample>
      </Section>

      <Section
        id="serverstatus"
        kicker="Launcher"
        title="ServerStatus"
        lead={<>Indicador del estado del servidor multijugador: <code>&lt;ServerStatus&gt;</code> muestra online/offline/desconocido con barra de acento de color y dirección del servidor.</>}
      >
        <Sample title="En línea" code="ServerStatus · online">
          <ServerStatus status="online" label="Online · 24/60" address="play.boff.gg" />
        </Sample>
        <Sample title="Offline" code="ServerStatus · offline">
          <ServerStatus status="offline" label="Servidor offline" />
        </Sample>
        <Sample title="Desconocido" code="ServerStatus · unknown">
          <ServerStatus status="unknown" label="Estado desconocido" />
        </Sample>
      </Section>
    </>
  )
}
