"use client"

import * as React from "react"
import {
  Bar,
  Button,
  Card,
  CircuitTag,
  EmptyState,
  Folio,
  Icon,
  IconButton,
  InspectOverlay,
  Modal,
  Mrz,
  NavButton,
  PageHead,
  PtsChip,
  RarityBadge,
  SectionLabel,
  Skeleton,
  Sprite,
  Stat,
  ToastHost,
  TypePill,
  VerifyBadge,
  toast,
} from "@/app/smartrotom/pasaporte/_components/ui"
import { Sample, Section } from "../showcase-shared"
import { Leaf, PS_DEMO_MRZ } from "./ps-demo"

/**
 * The 24 primitives, in the two groups the barrel itself is split into: the DESK and the
 * PAPER. The order here is deliberate — a reader who has just met the two-surface rule in
 * Bases should immediately see it enforced by the library's own shape.
 */
export function PsPrimitivasChapter() {
  const [modal, setModal] = React.useState(false)
  const [verify, setVerify] = React.useState(false)
  const [inspect, setInspect] = React.useState(false)

  return (
    <>
      <Section
        id="ps-escritorio"
        kicker="Pasaporte · Primitivas"
        title="El escritorio"
        lead={
          <>
            Ocho primitivas de cromo: <code>Button</code>, <code>IconButton</code>,{" "}
            <code>NavButton</code>, <code>Icon</code>, <code>Modal</code>/<code>Overlay</code>,{" "}
            <code>ToastHost</code>+<code>toast</code>, <code>VerifyBadge</code>,{" "}
            <code>InspectOverlay</code> y la infraestructura <code>ThemedLayer</code>. Todas viven
            sobre el nogal y ninguna funciona sobre el papel.
          </>
        }
      >
        <Sample
          title="Button"
          code="<Button active />"
          app="ps"
          note="El estado activo es ORO ESTAMPADO, y su etiqueta se va a casi negro: el pan de oro es una superficie CLARA, y el gris de cromo encima sería ilegible. Es la única primitiva del escritorio que invierte su tinta."
        >
          <Button>
            <Icon name="book" className="h-4 w-4" />
            Índice
          </Button>
          <Button active>
            <Icon name="scan" className="h-4 w-4" />
            Inspección
          </Button>
          <Button disabled>Deshabilitado</Button>
        </Sample>

        <Sample
          title="IconButton · NavButton"
          code='<IconButton aria-label /> · <NavButton aria-label />'
          app="ps"
          note="El `NavButton` deshabilitado no se limita a atenuarse: PIERDE el reborde de oro, el relieve y el pan. El final del libro es un hecho físico, así que el botón deja de parecer metal en vez de simplemente apagarse."
        >
          <IconButton aria-label="Marcapáginas">
            <Icon name="bookmark" className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Movimiento" active>
            <Icon name="sparkle" className="h-4 w-4" />
          </IconButton>
          <NavButton aria-label="Página anterior">
            <Icon name="chevL" className="h-[19px] w-[19px]" />
          </NavButton>
          <NavButton aria-label="Página siguiente" disabled>
            <Icon name="chevR" className="h-[19px] w-[19px]" />
          </NavButton>
        </Sample>

        <Sample
          title="Icon"
          code='<Icon name="shield" className="h-5 w-5" />'
          app="ps"
          note="Un mapa de SVG en línea, nada de `lucide-react` (§10). Todo glifo es un trazo de 2px con remates redondos a 24×24 para que se lean como un solo juego grabado; `star` es la excepción y va macizo, porque una estrella trazada a 20px sobre una moneda se lee como un garabato. El tamaño es una clase, no una prop: no hay `size`."
        >
          <div className="flex flex-wrap items-center gap-4 text-ps-gild-hi">
            {(
              [
                "shield",
                "scan",
                "medal",
                "crown",
                "trophy",
                "star",
                "idcard",
                "plane",
                "globe",
                "route",
                "rotom",
                "book",
              ] as const
            ).map((name) => (
              <span key={name} className="flex flex-col items-center gap-1.5">
                <Icon name={name} className="h-[22px] w-[22px]" />
                <span className="font-ps-mono text-[9px] text-ps-chrome-subtle">{name}</span>
              </span>
            ))}
          </div>
        </Sample>

        <Sample
          title="VerifyBadge · InspectOverlay"
          code="<VerifyBadge show /> · <InspectOverlay show />"
          app="ps"
          note="Los dos son `fixed`: pertenecen al mostrador, no al documento. Aquí se conmutan de verdad — pulsa y mira la esquina superior derecha de la ventana, que es donde aterrizan en la app real. La teja holográfica y el haz llevan `ps-loop`, así que `data-motion=off` los para."
        >
          <Button active={verify} aria-pressed={verify} onClick={() => setVerify((v) => !v)}>
            <Icon name="shield" className="h-4 w-4" />
            {verify ? "Ocultar sello" : "Mostrar VERIFICADO"}
          </Button>
          <Button active={inspect} aria-pressed={inspect} onClick={() => setInspect((v) => !v)}>
            <Icon name="scan" className="h-4 w-4" />
            {inspect ? "Apagar la lámpara" : "Encender la lámpara"}
          </Button>
          <VerifyBadge show={verify} />
          <InspectOverlay show={inspect} />
        </Sample>

        <Sample
          title="Modal · toast"
          code="<Modal title onClose /> · toast(msg)"
          app="ps"
          note="Los dos se portan a `document.body` y por tanto SALEN de `.ps-app`, donde toda variable `ps-*` deja de existir. `ThemedLayer` es lo que los devuelve al ámbito: reaplica la clase con `display: contents` y va copiando `data-ornament` / `data-motion` de la raíz viva, para que cambiar el ornamento con la hoja abierta también repinte la hoja."
        >
          <Button onClick={() => setModal(true)}>Abrir la hoja de repetición</Button>
          <Button onClick={() => toast("Documento sellado · Gobierno de Teras")}>Lanzar un aviso</Button>
          <ToastHost />
          {modal && (
            <Modal title="REPETICIÓN · GIMNASIO ROCA" onClose={() => setModal(false)}>
              <div className="p-[18px]">
                <p className="font-ps text-[13px] leading-relaxed text-ps-chrome-muted">
                  La hoja es CROMO, no una página: tarjeta azul noche, filete de oro y tipografía de
                  mostrador. Pintarla de papel la convertiría en una hoja suelta del libro, que es
                  precisamente lo que no es.
                </p>
              </div>
            </Modal>
          )}
        </Sample>
      </Section>

      <Section
        id="ps-pagina"
        kicker="Pasaporte · Primitivas"
        title="La página"
        lead={
          <>
            <code>Paper</code> es la hoja (guilloché, grano, foxing y la sombra del lomo);{" "}
            <code>PageHead</code> es su membrete; <code>Folio</code> es el mobiliario del pie.
            Ninguna de las tres sabe en qué capítulo está: el acento les llega por{" "}
            <code>--ps-chapter</code> desde la raíz de la página.
          </>
        }
      >
        <Sample
          title="PageHead"
          code="<PageHead eyebrow title accent />"
          app="ps"
          col
          note="El filete que sale de la ceja y se desvanece, el título en Marcellus y la regla de oro debajo. `accent` tiñe las últimas palabras del título con la tinta del capítulo."
        >
          <Leaf accent="plum">
            <PageHead eyebrow="Colección" title="Logros" accent="del Entrenador" />
          </Leaf>
        </Sample>

        <Sample
          title="Card · Stat"
          code="<Card /> · <Stat icon label value sub />"
          app="ps"
          col
          note="La tarjeta es un lavado blanco IMPRESO sobre la hoja, con un realce interior arriba: se lee como una zona más clara del mismo papel, no como una tarjeta apoyada encima. `Stat` la usa y pone la cifra en Marcellus, siempre tabular."
        >
          <Leaf accent="teal">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <Stat icon="foot" label="Distancia" value="182,4" sub="km recorridos" />
              <Stat icon="clock" label="Juego" value="214 h" sub="38 min" />
              <Stat icon="swords" label="Combates" value="412" sub="41 victorias" />
            </div>
            <Card className="mt-2.5">
              <p className="text-[12px] text-ps-ink-soft">
                Una <code className="font-ps-mono text-[11px]">Card</code> vacía, para lo que no es
                una cifra.
              </p>
            </Card>
          </Leaf>
        </Sample>

        <Sample
          title="Bar · SectionLabel"
          code="<Bar value max fill /> · <SectionLabel count />"
          app="ps"
          col
          note="El ancho de la barra es un `style` en línea: es un número real del dato, y un `w-[<pct>%]` interpolado no compilaría jamás (§4 — este es el caso sancionado). Sin `fill`, se tiñe con el degradado del capítulo; `fill` existe para las barras por categoría de Logros, que llevan tintas fijas."
        >
          <Leaf accent="olive">
            <SectionLabel count="6 / 8">Circuito de Fukitsu</SectionLabel>
            <Bar value={6} max={8} label="Medallas del circuito de Fukitsu" />
            <div className="mt-3.5">
              <SectionLabel count="41 %">Ligas</SectionLabel>
              <Bar value={41} thin fill="bg-ps-gild-lo" label="Progreso en ligas" />
            </div>
          </Leaf>
        </Sample>

        <Sample
          title="Folio"
          code='<Folio side page onIndex />'
          app="ps"
          col
          note="El número y la autoridad emisora van en la esquina EXTERIOR (donde los busca el pulgar) y la vuelta al índice en la INTERIOR, para que no choquen nunca a través del lomo. Es absoluto: aquí se ve dentro de una hoja con altura fijada a propósito."
        >
          <Leaf accent="gild" className="h-[130px]">
            <Folio side="right" page="07" onIndex={() => toast("Al Índice")} />
          </Leaf>
        </Sample>

        <Sample
          title="Skeleton · EmptyState"
          code="<Skeleton /> · <EmptyState icon title sub />"
          app="ps"
          col
          note="El esqueleto es el papel mientras la tinta se seca, no un bloque gris: `.ps-skeleton` es tinta del documento a poca alfa. El vacío se declara con honestidad — una hoja en blanco, rotulada."
        >
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <Leaf accent="plum">
              <Skeleton className="mb-2.5 h-[34px]" />
              <Skeleton className="mb-2 h-[52px]" />
              <Skeleton className="h-[52px]" />
            </Leaf>
            <Leaf accent="teal" className="min-h-[172px]">
              <EmptyState
                icon="globe"
                title="Sin sellos todavía"
                sub="Viaja por las regiones y gana medallas para estampar tu bitácora."
              />
            </Leaf>
          </div>
        </Sample>
      </Section>

      <Section
        id="ps-etiquetas"
        kicker="Pasaporte · Primitivas"
        title="Etiquetas y retratos"
        lead={
          <>
            Los cuatro sellos pequeños de la hoja, y el retrato. <code>RarityBadge</code> es el único
            que lee un dato de verdad: <code>rarity</code> es el <strong>porcentaje real</strong> de
            jugadores que completaron ese logro, calculado sobre{" "}
            <code>rotom_user_achievements</code>, no una etiqueta guardada en una columna.
          </>
        }
      >
        <Sample
          title="PtsChip · RarityBadge · CircuitTag"
          code="<PtsChip points /> · <RarityBadge rarity showPct /> · <CircuitTag />"
          app="ps"
          col
          note="Las bandas de rareza se leen como espera un jugador: cuantos menos la tengan, más rara. ≤5 % legendario · ≤15 % épico · ≤35 % raro · el resto común. El `+` del chip de puntos lleva el significado, no el color."
        >
          <Leaf accent="plum">
            <div className="flex flex-wrap items-center gap-3">
              <PtsChip points={25} />
              <PtsChip points={100} />
              <PtsChip points={10} sm />
              <RarityBadge rarity={3} showPct />
              <RarityBadge rarity={12} showPct />
              <RarityBadge rarity={28} showPct />
              <RarityBadge rarity={71} showPct />
              <CircuitTag>Fukitsu</CircuitTag>
            </div>
          </Leaf>
        </Sample>

        <Sample
          title="TypePill"
          code='<TypePill type="Eléctrico" />'
          app="ps"
          col
          note="Las tintas de tipo son la paleta clásica de Pokémon y NO son tintas de seguridad: no siguen el acento del capítulo. Van por `style` en línea desde un mapa literal, y las claves se normalizan sin acentos y en minúsculas porque el servidor manda los nombres como le apetece («Eléctrico», «electrico», «ELÉCTRICO» son un solo tipo)."
        >
          <Leaf accent="teal">
            <div className="flex flex-wrap items-center gap-2">
              {["Fuego", "Agua", "Planta", "Eléctrico", "Psíquico", "Siniestro", "Hada", "Dragón"].map(
                (t) => (
                  <TypePill key={t} type={t} />
                ),
              )}
              <TypePill type="Desconocido" />
            </div>
          </Leaf>
        </Sample>

        <Sample
          title="Sprite"
          code="<Sprite dex name size />"
          app="ps"
          col
          note="Un retrato en píxeles montado en un aro con relieve, como una foto pegada en una página. Se resuelve por el manifiesto de sprites compartido (`id:form:palette`), el mismo que usan el PC y la Pokédex — y se SUSCRIBE a la store en vez de leerla una vez, para que un equipo entero se rellene cuando llega el manifiesto en lugar de quedarse en blanco. Nada de `next/image`: el optimizador remuestrearía el pixel art (§10)."
        >
          <Leaf accent="teal">
            <div className="flex flex-wrap items-center gap-4">
              <Sprite dex={94} name="Gengar" size={72} />
              <Sprite dex={6} name="Charizard" size={72} />
              <Sprite dex={448} name="Lucario" size={72} />
              <Sprite dex={0} name="Sin sprite" size={72} />
            </div>
          </Leaf>
        </Sample>

        <Sample
          title="Mrz"
          code="<Mrz lines inspecting />"
          app="ps"
          col
          note="OCR-B en espíritu: tracking ancho, cifras tabulares, una línea por fila y NADA de saltos — una MRZ que se reflowea no es una MRZ. Bajo el escáner se vuelve teal sobre teal, que es la página diciendo «esto es lo que se está leyendo». Las dos líneas de 44 caracteres las compone `_utils/mrz.ts` a partir de campos reales: nombre, región, id derivado del uuid, año de alta, medallas y completitud. Los chevrones SON el relleno — para eso están."
        >
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <Leaf accent="oxblood" className="flex flex-col">
              <p className="mb-2 font-ps-mono text-[10px] uppercase tracking-[.2em] text-ps-ink-faint">
                En reposo
              </p>
              <Mrz lines={PS_DEMO_MRZ} />
            </Leaf>
            <Leaf accent="oxblood" className="flex flex-col">
              <p className="mb-2 font-ps-mono text-[10px] uppercase tracking-[.2em] text-ps-ink-faint">
                Bajo inspección
              </p>
              <Mrz lines={PS_DEMO_MRZ} inspecting />
            </Leaf>
          </div>
        </Sample>
      </Section>
    </>
  )
}
