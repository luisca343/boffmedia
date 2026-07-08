"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DEMO_TOOLS } from "../showcase-data"
import { DISPLAY, DISPLAY_EM, HEAD4, Sample, Section } from "../showcase-shared"
import { Button } from "@/components/boffmedia/primitives/button"
import { Empty } from "@/components/boffmedia/primitives/empty"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Kicker } from "@/components/boffmedia/primitives/kicker"
import { Panel } from "@/components/boffmedia/primitives/panel"
import { ExtLinks, FeaturedTool, GameBanner, GameLogo, ToolCard, ToolGrid, ToolShell, TxSection, VideoHero, buildCategory } from "@/components/boffmedia/ui/tools"
import { useTranslations } from "next-intl"

export function HubChapter() {
  const t = useTranslations()
  const pokeCat = React.useMemo(() => buildCategory("pokemon", t), [t])
  return (
    <>
            <Section id="panelsec" kicker="Hub de herramientas" title="Panel de sección" lead={<>Bloque de sección estandarizado (<code>TxSection</code>): titular con barra de acento, hilo discontinuo, contador en mono y ranura de acciones. Estructura cada página del hub.</>}>
              <Sample title="Con contador y acciones" code="<TxSection count actions>" col>
                <TxSection title="Todas las herramientas" count="10 tools" actions={<Button size="sm" variant="ghost" iconRight="arrow">Ver todo</Button>}>
                  <ToolGrid tools={DEMO_TOOLS} />
                </TxSection>
              </Sample>
              <Sample title="Con pista" code="<TxSection hint>" col>
                <TxSection title="Recursos externos" hint={<><Icon name="external" size={12} />Salen del sitio</>}>
                  <p className="text-txt-muted text-[14px]">Contenido de la sección…</p>
                </TxSection>
              </Sample>
            </Section>

            <Section id="tarjetas" kicker="Hub de herramientas" title="Tarjeta de herramienta" lead={<>La «fila» de herramienta (<code>ToolCard</code>): raíl de color por juego, icono, título, descripción y distintivos (nuevo · popularidad). <code>ToolGrid</code> las dispone en rejilla responsive.</>}>
              <Sample title="Tarjeta suelta" code="<ToolCard tool>" grid>
                <ToolCard tool={DEMO_TOOLS[0]} />
                <ToolCard tool={DEMO_TOOLS[1]} />
              </Sample>
              <Sample title="Rejilla" code="<ToolGrid tools>" col>
                <ToolGrid tools={DEMO_TOOLS} />
              </Sample>
            </Section>

            <Section id="portadas" kicker="Hub de herramientas" title="Portada de juego" lead={<>El sello del juego en su tono (<code>GameLogo</code>): iniciales o imagen, con el color de familia y el corte diagonal. Se usa en el conmutador del shell y las cabeceras. <em>Nota:</em> el v3 no tiene una tarjeta «GameCover» aparte — la entrada completa a un juego se compone con <code>CategoryLanding</code>/<code>GameBanner</code> (ver «Banner de juego»).</>}>
              <Sample title="Sellos por tono" code="<GameLogo hueColor>">
                <GameLogo label="VGC" hueColor="hsl(18 90% 55%)" />
                <GameLogo label="MH" hueColor="hsl(150 55% 52%)" />
                <GameLogo label="MC" hueColor="hsl(140 45% 55%)" />
                <GameLogo label="OT" hueColor="hsl(265 60% 66%)" />
              </Sample>
              <Sample title="Tamaños" code="size sm · md · lg">
                <GameLogo label="VGC" hueColor="hsl(18 90% 55%)" size="sm" />
                <GameLogo label="VGC" hueColor="hsl(18 90% 55%)" />
                <GameLogo label="VGC" hueColor="hsl(18 90% 55%)" size="lg" />
              </Sample>
            </Section>

            <Section id="banner" kicker="Hub de herramientas" title="Banner de juego" lead={<>Cabecera de la página de categoría (<code>GameBanner</code>): prefijo + destacado en la voz de la señal, subtítulo y arte de fondo. Datos reales vía <code>buildCategory</code>.</>}>
              <Sample title="Banner de categoría" code="<GameBanner cat>" col note="Se compone dentro de CategoryLanding en /pokemon /minecraft /mhwilds /otros.">
                {pokeCat ? <div className="w-full">{<GameBanner cat={pokeCat} />}</div> : <Empty title="Sin datos de categoría" />}
              </Sample>
            </Section>

            <Section id="destacada" kicker="Hub de herramientas" title="Destacada" lead={<>La herramienta destacada de una categoría (<code>FeaturedTool</code>): hero con arte, descripción y CTA. Es la primera herramienta <code>featured</code> del juego.</>}>
              <Sample title="Herramienta destacada" code="<FeaturedTool cat>" col>
                {pokeCat?.featuredTool ? <div className="w-full">{<FeaturedTool cat={pokeCat} />}</div> : <Empty title="Sin herramienta destacada" />}
              </Sample>
            </Section>

            <Section id="herovideo" kicker="Hub de herramientas" title="Hero con vídeo" lead={<>Hero del hub (<code>VideoHero</code>): vídeo de fondo en bucle, líneas de retransmisión y velo. Con <code>motion-reduce</code> cae a póster/superficie.</>}>
              <Sample title="Hero con vídeo" code="<VideoHero>" col>
                <div className="w-full">
                  <VideoHero>
                    <div className="px-8 py-16">
                      <Kicker>Herramientas</Kicker>
                      <h3 className={cn(DISPLAY, DISPLAY_EM, "text-[clamp(28px,5vw,48px)] mt-2")}>Elige tu <em>señal</em></h3>
                    </div>
                  </VideoHero>
                </div>
              </Sample>
            </Section>

            <Section id="sidenav" kicker="Hub de herramientas" title="Sidebar colapsable" lead={<>El shell de herramientas (<code>ToolShell</code>): carril lateral colapsable y fijable (72px↔264px), cabecera con conmutador de juego y cajón móvil. Se monta en los layouts por juego.</>}>
              <Sample title="Shell en vivo" code="<ToolShell slug='pokemon'>" col note="Vista previa recortada y redimensionable; en la app ocupa toda la altura bajo la barra. Pasa el ratón por el carril para expandirlo.">
                <div className="w-full h-[520px] resize-y overflow-auto border border-solid border-line">
                  <ToolShell slug="pokemon">
                    <div className="p-6">
                      <Kicker>Contenido</Kicker>
                      <h3 className={cn(HEAD4, "text-[22px] mt-2")}>Página de herramienta</h3>
                      <p className="text-txt-muted mt-2 text-[14px]">El contenido de cada herramienta va aquí, con el carril a la izquierda.</p>
                    </div>
                  </ToolShell>
                </div>
              </Sample>
            </Section>

            <Section id="externos" kicker="Hub de herramientas" title="Enlaces externos" lead={<>Recursos que salen del sitio (<code>ExtLinks</code>): tarjetas con título, descripción e icono de enlace externo. Datos reales de la categoría.</>}>
              <Sample title="Enlaces externos" code="<ExtLinks items>" col>
                {pokeCat && pokeCat.ext.length > 0 ? <div className="w-full">{<ExtLinks items={pokeCat.ext} />}</div> : <Empty title="Sin enlaces externos" />}
              </Sample>
            </Section>
    </>
  )
}
