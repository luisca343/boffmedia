"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DISPLAY, HEAD4, Sample, Section } from "../showcase-shared"
import { Button, Chip, CountUp, Kicker, Ticker } from "@boffmedia/ui"
import { GLARE } from "@/components/boffmedia/ui/landing/landing-shared"
import { Decode, Kinetic, useSignalFX } from "@/components/boffmedia/ui/landing/travesia-fx"
import { Marquee } from "@/components/boffmedia/ui/layout/Marquee"

function FxPlayground() {
  const ref = React.useRef<HTMLDivElement>(null)
  useSignalFX(ref, 3)
  return (
    <div ref={ref} className="flex gap-[22px] items-center flex-wrap w-full p-7 border border-dashed border-line-2">
      <div
        data-glare
        data-tilt-fx
        className={cn("relative overflow-hidden w-[250px] max-w-full p-5 bg-panel border border-solid border-line cut-corner transition-transform duration-[140ms] will-change-transform", GLARE)}
      >
        <span className="font-mono text-[11px] text-txt-dim">01</span>
        <h4 className={cn(HEAD4, "text-[18px] mt-2")}>Tarjeta táctil</h4>
        <p className="mt-1 text-[13px] text-txt-muted">Tilt 3D + glare siguiendo el puntero.</p>
      </div>
      <Button variant="pri" iconRight="arrow">
        Botón magnético
      </Button>
    </div>
  )
}
export function MovimientoChapter() {
  const [fxKey, setFxKey] = React.useState(0)
  return (
    <>
            <Section
              id="fxniveles"
              kicker="Movimiento"
              title="Niveles de FX"
              lead={<>La capa de movimiento es acumulativa: <strong>base</strong> (reveals, progreso de scroll, contadores, <code>Decode</code>), <strong>emisión</strong> (añade partículas y glare) y <strong>directo</strong> (añade cursor reticular, botones magnéticos y tilt 3D). Todo respeta <code>prefers-reduced-motion</code> y el interruptor global de animaciones.</>}
            >
              <Sample title="Niveles" code="useSignalFX(ref, lvl)" note={<>Reutilizables sobre cualquier contenedor con <code>useSignalFX</code>: el reveal por scroll (<code>useReveal</code> / <code>data-reveal</code>), el glare, el imán (<code>data-btn</code>) y el tilt 3D. Ligados a la landing: la barra de progreso (<code>FxProgress</code>), el cursor reticular (<code>FxCursor</code>) y los haces de luz (<code>beams</code>).</>}>
                <Chip>1 · Base</Chip>
                <Chip>2 · Emisión</Chip>
                <Chip on>3 · Directo</Chip>
              </Sample>
            </Section>

            <Section
              id="marquesina"
              kicker="Movimiento"
              title="Marquesina"
              lead={<>Cinta de titulares en display italic que alterna relleno y contorno, separada por diamantes. Divide bloques largos en la landing.</>}
            >
              <Sample title="Marquesina" code="<Marquee items speed>" col>
                <div className="w-full">
                  <Marquee items={["BoffMedia", "Wingull 2", "SmartRotom", "Torneos"]} speed={16} />
                </div>
              </Sample>
              <Sample title="Ticker" code="<Ticker items>" col note={<>La tira de titulares de la barra del shell: desplazamiento continuo con separadores en diamante de acento. Cada <code>◆</code> sale del <code>&lt;em&gt;</code> incrustado.</>}>
                <div className="flex w-full items-center border border-solid border-line bg-panel px-4 py-[10px] font-mono text-[12px] tracking-[0.04em] text-txt-muted">
                  <Ticker items={["Copa Relámpago · inscripción abierta", "Nueva regulación H disponible", "Sorteo: clave de Steam", "Wingull 2 este sábado"]} />
                </div>
              </Sample>
            </Section>

            <Section
              id="cinetica"
              kicker="Movimiento"
              title="Palabra cinética"
              lead={<>Rótulo gigante en contorno que se desplaza horizontalmente ligado al scroll — marca de sección en Wingull 2 y Comunidad. <code>dir</code> controla el sentido, <code>pos</code> lo ancla arriba o abajo.</>}
            >
              <Sample title="Palabra cinética" code="<Kinetic word dir pos>" col note={<>Haz scroll para verla moverse. El padre necesita <code>position: relative; overflow: hidden</code>.</>}>
                <div className="relative h-[190px] w-full overflow-hidden border border-dashed border-line-2">
                  <Kinetic word="Señal" dir={1} pos="top" />
                </div>
              </Sample>
            </Section>

            <Section
              id="contador"
              kicker="Movimiento"
              title="Contador y decode"
              lead={<><code>CountUp</code> anima cifras al entrar en pantalla respetando prefijos, sufijos y agrupación («12 480», «412+», «03»). <code>Decode</code> «sintoniza» el texto de los kickers con caracteres de interferencia.</>}
            >
              <Sample title="En vivo" code="<CountUp value> · <Decode text>" col note={<>Pulsa reproducir para volver a lanzarlos.</>}>
                <div key={fxKey} className="flex flex-wrap items-center gap-[34px]">
                  <span className={cn(DISPLAY, "text-[54px] leading-none")}>
                    <CountUp value="12 480" />
                  </span>
                  <span className={cn(DISPLAY, "text-[54px] leading-none text-accent")}>
                    <CountUp value="412+" />
                  </span>
                  <Kicker>
                    <Decode text="Comunidad Pixelmon · En vivo" />
                  </Kicker>
                </div>
                <div>
                  <Button size="sm" icon="play" onClick={() => setFxKey((k) => k + 1)}>
                    Reproducir
                  </Button>
                </div>
              </Sample>
            </Section>

            <Section
              id="interaccion"
              kicker="Movimiento"
              title="Cursor e imán"
              lead={<>Nivel «directo»: cursor reticular propio en la landing, botones magnéticos (<code>data-btn</code>) y tilt 3D con glare en tarjetas (<code>data-tilt-fx</code>, <code>data-glare</code>). Solo con puntero fino y sin <code>prefers-reduced-motion</code>.</>}
            >
              <Sample title="Área de prueba" code="useSignalFX · data-glare · data-tilt-fx" col note={<>Mueve el puntero por encima: la tarjeta se inclina y brilla, y el botón se imanta hacia el cursor.</>}>
                <FxPlayground />
              </Sample>
            </Section>
    </>
  )
}
