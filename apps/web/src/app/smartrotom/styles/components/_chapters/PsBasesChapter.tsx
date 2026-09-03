"use client"

import { Button, Icon, NavButton } from "@/app/smartrotom/pasaporte/_components/ui"
import { Sample, Section, Swatches } from "../showcase-shared"
import { Leaf } from "./ps-demo"

/**
 * Pasaporte's foundations — `ps-*`, a state-issued travel document lying open on an
 * immigration counter.
 *
 * The chapter leads with the two surfaces because everything else follows from them: this
 * is the only SmartRotom system with two materials inside ONE scope root, and putting a
 * token on the wrong one does not look wrong — it renders invisible.
 */
export function PsBasesChapter() {
  return (
    <>
      <Section
        id="ps-superficies"
        kicker="Pasaporte"
        title="Dos superficies"
        lead={
          <>
            Una sola raíz de ámbito (<code>.ps-app</code>), dos materiales: el{" "}
            <strong>escritorio</strong> de nogal, cuero y oro — la barra superior, los controles, el
            cromo de inspección y la hoja del modal — y el <strong>papel</strong> crema del interior
            del libro. Cada primitiva pertenece a uno y sólo a uno, y lo declara en la primera línea
            de su fichero. Es la regla más cara del sistema: <code>text-ps-ink</code> sobre el
            escritorio es tinta casi negra sobre nogal casi negro, y{" "}
            <code>text-ps-chrome-fg</code> sobre el papel es blanco sobre crema. Ninguno de los dos
            falla, ninguno de los dos avisa: simplemente no se leen.
          </>
        }
      >
        <Sample
          title="El escritorio · el mostrador"
          code="bg-ps-desk · bg-ps-navy · bg-ps-gild"
          app="ps"
          canvas={false}
          note="El fondo de nogal no lo pinta ninguna clase de utilidad: lo pinta la capa base de `.ps-app` (el charco de luz de la lámpara, las juntas de los tablones y la veta). Por eso todo espécimen de esta sección aparece ya sobre el mostrador sin pedirlo."
        >
          <Swatches
            tokens={[
              ["bg-ps-desk", "Nogal"],
              ["bg-ps-desk-hi", "Nogal, luz"],
              ["bg-ps-desk-lo", "Nogal, sombra"],
              ["bg-ps-leather", "Cuero (la contratapa)"],
              ["bg-ps-navy", "Azul de estado"],
              ["bg-ps-gild", "Pan de oro"],
              ["bg-ps-gild-hi", "Oro, brillo"],
              ["bg-ps-gild-lo", "Oro, sombra"],
              ["bg-ps-ribbon", "Cinta de seda"],
              ["bg-ps-chrome-fg", "Tinta del cromo"],
            ]}
          />
        </Sample>

        <Sample
          title="El papel · el documento"
          code="bg-ps-paper · text-ps-ink"
          app="ps"
          canvas={false}
          note="`--rule` no existe: la línea de hoja del sistema es literalmente `border-ps-ink/22`, y ese `/22` sólo compila porque `theme.extend.opacity` lo declara — la escala de Tailwind va de cinco en cinco y `/22` no está en ella. Ver §4 en la ficha de la app."
        >
          <Swatches
            tokens={[
              ["bg-ps-paper", "Crema"],
              ["bg-ps-paper-2", "Crema, fondo"],
              ["bg-ps-paper-edge", "Canto"],
              ["bg-ps-ink", "Tinta"],
              ["bg-ps-ink-soft", "Tinta suave"],
              ["bg-ps-ink-faint", "Tinta tenue"],
            ]}
          />
        </Sample>

        <Sample
          title="Lo mismo, en los dos materiales"
          code="ps-app + .ps-paper-surface"
          app="ps"
          col
          note="A la izquierda, cromo sobre nogal. A la derecha, la misma jerarquía sobre el papel. Ni una sola clase se repite entre las dos columnas — y ese es exactamente el punto."
        >
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2.5 rounded-[6px] border border-ps-gild/18 p-4">
              <span className="font-ps-mono text-[0.625rem] uppercase tracking-[.2em] text-ps-chrome-subtle">
                Escritorio
              </span>
              <span className="font-ps-ceremony text-[1.1875rem] text-ps-chrome-fg">Gobierno de Teras</span>
              <span className="font-ps text-[0.78125rem] text-ps-chrome-muted">
                Control de Fronteras · mostrador 04
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Button active>
                  <Icon name="scan" className="h-4 w-4" />
                  Inspección
                </Button>
                <NavButton aria-label="Página siguiente">
                  <Icon name="chevR" className="h-[1.1875rem] w-[1.1875rem]" />
                </NavButton>
              </div>
            </div>

            <Leaf accent="info">
              <span className="font-ps-mono text-[0.625rem] uppercase tracking-[.2em] text-ps-chapter-deep">
                Papel
              </span>
              <p className="mt-1 font-ps-ceremony text-[1.1875rem] text-ps-ink">Carné Oficial</p>
              <p className="font-ps text-[0.78125rem] text-ps-ink-soft">
                Expedido en Fukitsu · válido cuatro años
              </p>
              <p className="ps-num mt-2.5 font-ps-mono text-[0.6875rem] tracking-[.12em] text-ps-ink-faint">
                TRS-7741-K
              </p>
            </Leaf>
          </div>
        </Sample>
      </Section>

      <Section
        id="ps-tintas"
        kicker="Pasaporte"
        title="Tintas de seguridad"
        lead={
          <>
            Seis tintas, y ninguna primitiva sabe cuál lleva puesta. Cada capítulo fija el par{" "}
            <code>--ps-chapter</code> / <code>--ps-chapter-deep</code> en su propia raíz con{" "}
            <code>chapterVars(accent)</code>, y todo lo que hay dentro lo hereda a través de{" "}
            <code>text-ps-chapter-deep</code>, <code>bg-ps-chapter</code> y compañía. Es lo que
            permite que un mismo <code>Card</code> se imprima en granate en Identidad y en ciruela en
            Logros sin una sola rama en el código.
          </>
        }
      >
        <Sample title="Las seis tintas" code="ps-oxblood · teal · plum · olive · info · gild" app="ps" canvas={false}>
          <Swatches
            tokens={[
              ["bg-ps-oxblood", "Oxblood · Identidad"],
              ["bg-ps-info", "Info · Carné"],
              ["bg-ps-teal", "Teal · Equipo, Bitácora"],
              ["bg-ps-olive", "Olive · Medallas"],
              ["bg-ps-plum", "Plum · Logros, Crónica"],
              ["bg-ps-gild-lo", "Gild · Índice, Temporada"],
            ]}
          />
        </Sample>

        <Sample
          title="Metales"
          code="ps-tier-*"
          app="ps"
          canvas={false}
          note="Una sola rampa, usada dos veces: la medalla de un logro y el peldaño de la escalera de temporada que se llama igual son el mismo oro. Los logros llegan hasta `platino`; la escalera sigue hasta `maestro`. Se aplican por mapas de clases literales en `_utils/tiers.ts` — un `text-ps-tier-<tier>` interpolado no compilaría en absoluto (§4)."
        >
          <Swatches
            tokens={[
              ["bg-ps-tier-bronce", "Bronce"],
              ["bg-ps-tier-plata", "Plata"],
              ["bg-ps-tier-oro", "Oro"],
              ["bg-ps-tier-platino", "Platino"],
              ["bg-ps-tier-diamante", "Diamante"],
              ["bg-ps-tier-maestro", "Maestro"],
            ]}
          />
        </Sample>

        <Sample title="Estados" code="ps-ok · ps-warn · ps-bad" app="ps" canvas={false}>
          <Swatches
            tokens={[
              ["bg-ps-ok", "Válido"],
              ["bg-ps-warn", "Caduca pronto"],
              ["bg-ps-bad", "Caducado"],
            ]}
          />
        </Sample>
      </Section>

      <Section
        id="ps-tipografia"
        kicker="Pasaporte"
        title="Tipografía"
        lead={
          <>
            Cuatro caras, con los papeles muy repartidos y nada de solaparse. Cinzel es{" "}
            <strong>inscripcional</strong>: mayúsculas grabadas, y sólo donde algo va estampado en
            oro o cincelado — la portada, el numeral romano de la temporada, el folio. Marcellus
            lleva los encabezados y <em>todas</em> las cifras del documento. Public Sans es la
            grotesca cívica de las etiquetas. Spline Sans Mono es la máquina: la MRZ, los códigos y
            las fechas.
          </>
        }
      >
        <Sample
          title="Cinzel · inscripcional"
          code="font-ps-display"
          app="ps"
          note="Sólo versales. Cinzel no tiene minúsculas de verdad y una frase en caja baja se ve rota: si tu texto no va grabado o estampado, no es esta cara."
        >
          <div className="flex flex-col gap-2">
            <span className="ps-foil font-ps-display text-[1.625rem] font-bold tracking-[.14em]">
              PASAPORTE
            </span>
            <span className="font-ps-display text-[1.125rem] font-extrabold tracking-[.12em] text-ps-gild-hi">
              TEMPORADA VII
            </span>
          </div>
        </Sample>

        <Sample
          title="Marcellus · ceremonia"
          code="font-ps-ceremony"
          app="ps"
          col
          note="La cara de los títulos de capítulo Y de todo VALOR: el nombre del entrenador, la cifra de una placa, el rango. Sobre el papel, siempre `text-ps-ink`."
        >
          <Leaf accent="oxblood">
            <p className="font-ps-ceremony text-[1.875rem] leading-none text-ps-ink">Identidad</p>
            <p className="ps-num mt-2 font-ps-ceremony text-[1.625rem] leading-none text-ps-ink">1.284</p>
            <p className="mt-1 font-ps text-[0.6875rem] text-ps-ink-faint">Capturas registradas</p>
          </Leaf>
        </Sample>

        <Sample
          title="Public Sans · cívica"
          code="font-ps"
          app="ps"
          col
          note="El cuerpo y las etiquetas de campo. Es la cara neutra del documento: la que no quiere que la mires."
        >
          <Leaf accent="teal">
            <p className="font-ps text-[0.78125rem] font-semibold text-ps-ink-soft">
              Nombre del titular
            </p>
            <p className="font-ps text-[0.78125rem] text-ps-ink-soft">
              El cuerpo del documento va en Public Sans, a 12,5px, en tinta suave.
            </p>
          </Leaf>
        </Sample>

        <Sample
          title="Spline Sans Mono · máquina"
          code="font-ps-mono · .ps-num"
          app="ps"
          col
          note="`.ps-num` fija cifras tabulares y NO es negociable: un pasaporte cuyos dígitos cambian de ancho entre dos filas no es un pasaporte. Va en toda cifra, en todo código y en toda fecha."
        >
          <Leaf accent="info">
            <p className="ps-num font-ps-mono text-[0.8125rem] tracking-[.12em] text-ps-ink-soft">
              TRS-7741-K · 14 MAR 2024
            </p>
            <p className="ps-num font-ps-mono text-[0.8125rem] tracking-[.12em] text-ps-ink-soft">
              REG-0912-F · 02 ABR 2024
            </p>
          </Leaf>
        </Sample>
      </Section>

      <Section
        id="ps-materiales"
        kicker="Pasaporte"
        title="Materiales y ornamento"
        lead={
          <>
            Lo que Tailwind no sabe decir — la impresión de seguridad a varias capas, el borde
            festoneado de un lacre, el tejido del buckram, el oro holográfico — vive como clase de
            componente en el plugin, no como <code>style</code> incrustado, para que las páginas
            sigan siendo JSX legible. Y por encima de todo eso hay un único mando:{" "}
            <code>data-ornament</code>.
          </>
        }
      >
        <Sample
          title="data-ornament · una propiedad del documento"
          code='.ps-app[data-ornament="minimal | tasteful | maximal"]'
          app="ps"
          col
          note="No es un tema: es cuánto grita la impresión de seguridad. Un solo atributo mueve los dos multiplicadores a la vez (`--ps-guilloche`, `--ps-grain`), y por eso se lee como una propiedad física del documento y no como tres casillas. En «Mínimo» la guilloché desaparece del todo — y con ella la nota de Rotom, que se oculta por selector CSS, no por una rama en JS: un documento ceremonial no tiene mascota."
        >
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {(["minimal", "tasteful", "maximal"] as const).map((o) => (
              // `.ps-app` again, because the ornament multipliers are declared as
              // `.ps-app[data-ornament=…]` — the class and the attribute have to be on the
              // same element. `[background:none]` cancels the walnut the base layer would
              // otherwise repaint inside the stage that is already painting it.
              <div
                key={o}
                data-ornament={o}
                className="ps-app grid gap-2 rounded-[6px] border border-ps-gild/18 p-3 [background:none]"
              >
                <span className="font-ps-mono text-[0.625rem] uppercase tracking-[.18em] text-ps-chrome-subtle">
                  {o}
                </span>
                <div className="ps-paper-surface relative h-[6.5rem] overflow-hidden rounded-[4px] border border-ps-ink/22" />
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="La portada y el grosor"
          code=".ps-buckram · .ps-emboss · .ps-foil · .ps-leaves-r"
          app="ps"
          note="La tela de la tapa, y el bloque de hojas visto de canto. El grosor NO es una sombra: son doce escalones duros de 1px que alternan hoja iluminada (`--ps-leaf`) y sombra entre hojas (`--ps-leaf-shade`), y debajo una losa de 16px con el cartón de la tapa (`--ps-board`). Difumina esos escalones y el libro vuelve a ser una hoja suelta. Los pasos huyen del lomo, así que `-r` y `-l` son espejo."
        >
          <div className="relative grid h-[9.375rem] w-full place-items-center">
            <div className="ps-buckram ps-emboss ps-leaves-r relative grid h-[7rem] w-[10.75rem] place-items-center overflow-hidden rounded-[4px] bg-gradient-to-br from-ps-navy to-ps-navy-deep">
              <span className="ps-foil font-ps-display text-[0.8125rem] font-bold tracking-[.16em]">
                PASAPORTE
              </span>
            </div>
          </div>
        </Sample>

        <Sample
          title="Holografía"
          code=".ps-holo · .ps-holo-gold · .ps-holo-ring"
          app="ps"
          note="El único sitio del documento donde se admite un arcoíris saturado. Un holograma DEBE desentonar sobre el papel — eso es justo lo que lo hace leerse como medida de seguridad y no como adorno. Los tres bucles llevan `ps-loop`, así que `data-motion=off` los aparca."
        >
          <div className="flex flex-wrap items-center gap-5">
            <span className="ps-holo h-[2.875rem] w-[2.875rem] rounded-lg" />
            <span className="ps-holo-gold h-[2.875rem] w-[2.875rem] rounded-full" />
            <span className="ps-holo-ring grid h-[4.625rem] w-[4.625rem] place-items-center rounded-full bg-ps-paper text-center font-ps-mono text-[0.5625rem] tracking-[.1em] text-ps-teal-deep">
              SELLO
              <br />
              VÁLIDO
            </span>
          </div>
        </Sample>

        <Sample
          title="La lámpara del inspector"
          code=".ps-grid-glow · .ps-beam · animate-ps-scan"
          app="ps"
          note="La rejilla teal y la barra de barrido del modo Inspección. En la app son `fixed` y cubren todo el mostrador; aquí van recortadas dentro del espécimen para poder verlas."
        >
          <div className="relative h-[6.875rem] w-full overflow-hidden rounded-[6px] border border-ps-gild/18 bg-ps-desk-lo">
            <span className="ps-grid-glow absolute inset-0" />
            <span className="ps-beam ps-loop absolute left-0 right-0 h-[3.75rem] animate-ps-scan motion-reduce:animate-none" />
          </div>
        </Sample>
      </Section>
    </>
  )
}
