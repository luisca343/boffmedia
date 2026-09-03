"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DEMO_TOOLS } from "../showcase-data"
import { DISPLAY, DISPLAY_EM, HEAD4, Sample, Section } from "../showcase-shared"
import { Button, Empty, Icon, Panel, Seg } from "@boffmedia/ui"
import { ExtLinks, FeaturedTool, GameBanner, GameCover, GameLogo, ToolCard, ToolGrid, ToolShell, TxSection, VideoHero, buildCategory } from "@/components/boffmedia/ui/tools"
import { useTranslations } from "next-intl"

export function HubChapter() {
  const t = useTranslations()
  const [cardVariant, setCardVariant] = React.useState("senal")
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
                  <p className="text-txt-muted text-[0.875rem]">Contenido de la sección…</p>
                </TxSection>
              </Sample>
            </Section>

            <Section id="tarjetas" kicker="Hub de herramientas" title="Tarjeta de herramienta" lead={<>La pieza que puebla el hub y las páginas de juego. Un solo componente (<code>ToolCard</code>) con dos pieles seleccionables por <code>variant</code>: <strong>señal</strong> (rica, vertical, con categoría y flecha) y <strong>fila</strong> (compacta horizontal). El raíl superior y el icono se tiñen con el hue del juego. Estados: normal, popular y «pronto» (deshabilitada).</>}>
              <Sample title="Variante en vivo" code="<ToolCard variant> · <ToolGrid variant>" col note="La misma tarjeta, dos disposiciones. En el hub se elige por juego; la próxima herramienta (Bestiario) usará la piel «señal».">
                <div className="mb-[1.125rem]">
                  <Seg
                    value={cardVariant}
                    onChange={setCardVariant}
                    options={[
                      { value: "senal", label: "Señal" },
                      { value: "fila", label: "Fila" },
                    ]}
                  />
                </div>
                <ToolGrid tools={DEMO_TOOLS} variant={cardVariant as "senal" | "fila"} />
              </Sample>
              <Sample title="Piel señal y piel fila" code={`variant="senal" · "fila"`} col>
                <div className="grid w-full gap-4 sm:grid-cols-2">
                  <ToolCard tool={DEMO_TOOLS[0]} variant="senal" />
                  <ToolCard tool={DEMO_TOOLS[3]} variant="senal" />
                </div>
                <div className="grid w-full gap-2">
                  <ToolCard tool={DEMO_TOOLS[1]} variant="fila" />
                  <ToolCard tool={DEMO_TOOLS[2]} variant="fila" />
                </div>
              </Sample>
            </Section>

            <Section id="portadas" kicker="Hub de herramientas" title="Portada de juego" lead={<>La entrada a cada juego en el hub (<code>GameCover</code>): arte de fondo (un <code>image-slot</code>, aquí con placeholder tinteado), sello del juego, contador de herramientas, título, lema y CTA. Variante <code>mini</code> para el layout mixto. El sello del juego (<code>GameLogo</code>) es el átomo reutilizable en su tono.</>}>
              <Sample title="Portadas" code="<GameCover game mini>" col note="Comparten el hue del juego; la variante mini es la tira ancha sin lema.">
                <div className="grid w-full max-w-[35rem] gap-[1.125rem]">
                  <GameCover game={{ name: "Pokémon", tagline: "Herramientas competitivas de VGC: cálculo, meta, tracker y más.", slug: "pokemon", hueColor: "hsl(18 90% 55%)", logoLabel: "VGC", toolCount: 6 }} />
                  <GameCover game={{ name: "Monster Hunter", tagline: "Bestiario, armería y planificador para MH Wilds.", slug: "mhwilds", hueColor: "hsl(150 55% 52%)", logoLabel: "MH", toolCount: 5 }} mini />
                </div>
              </Sample>
              <Sample title="Sello del juego" code="<GameLogo hueColor size>">
                <GameLogo label="VGC" hueColor="hsl(18 90% 55%)" size="sm" />
                <GameLogo label="MH" hueColor="hsl(150 55% 52%)" />
                <GameLogo label="MC" hueColor="hsl(140 45% 55%)" size="lg" />
                <GameLogo label="OT" hueColor="hsl(265 60% 66%)" size="lg" />
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
                      <h3 className={cn(DISPLAY, DISPLAY_EM, "text-[clamp(1.75rem,5vw,3rem)]")}>Elige tu <em>señal</em></h3>
                    </div>
                  </VideoHero>
                </div>
              </Sample>
            </Section>

            <Section id="sidenav" kicker="Hub de herramientas" title="Sidebar colapsable" lead={<>El shell de herramientas (<code>ToolShell</code>): carril lateral colapsable y fijable (72px↔264px), cabecera con conmutador de juego y cajón móvil. Se monta en los layouts por juego.</>}>
              <Sample title="Shell en vivo" code="<ToolShell slug='pokemon'>" col note="Vista previa recortada y redimensionable; en la app ocupa toda la altura bajo la barra. Pasa el ratón por el carril para expandirlo.">
                <div className="w-full h-[32.5rem] resize-y overflow-auto border border-solid border-line">
                  <ToolShell slug="pokemon">
                    <div className="p-6">
                      <h3 className={cn(HEAD4, "text-[1.375rem]")}>Página de herramienta</h3>
                      <p className="text-txt-muted mt-2 text-[0.875rem]">El contenido de cada herramienta va aquí, con el carril a la izquierda.</p>
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
