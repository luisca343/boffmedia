"use client"

import { Sample, Section } from "../showcase-shared"
import { Badge, Button, CodeBlock, DataList, Empty, Panel, Ph, Progress, Rank, RankRow, SearchInput, Seg, Select, Skeleton, StatChip, Stats, Table, Third, ToolBar, ToolBarSpacer, ToolHeader, ToolSeal, ToolTitle } from "@boffmedia/ui"

export function PatronesChapter() {

  return (
    <>
            <Section id="paneles" kicker="Patrones" title="Paneles">
              <Sample title="Panel con cabecera" code="<Panel title aside>" col>
                <Panel title="Próximos eventos" aside={<Badge tone="live">En vivo</Badge>}>
                  <p className="text-txt-muted text-[14px]">El contenido vive aquí. La esquina superior derecha lleva el corte de 16px — la firma del sistema.</p>
                </Panel>
              </Sample>
              <Sample title="Tercio inferior (fila de evento)" code="<Third>" col>
                <div className="grid gap-3">
                  <Third date="14" month="Jun" title="Torneo Pixelmon Wingull 2" meta="Torneo · Servidor Wingull" side={<Badge tone="new">Inscripción</Badge>} onClick={() => {}} />
                  <Third date="21" month="Jun" title="Minecraft Bingo · Edición rápida" meta="Competitivo · Servidor Bingo" side={<Badge>Próximo</Badge>} muted />
                </div>
              </Sample>
              <Sample title="Bloque de estadísticas" code="<Stats>">
                <div className="w-full overflow-x-auto">
                  <Stats
                    items={[
                      { n: <>412<b>+</b></>, l: "Jugadores" },
                      { n: "96", l: "Plazas" },
                      { n: "03", l: "Eventos" },
                    ]}
                  />
                </div>
              </Sample>
            </Section>

            <Section
              id="chasis"
              kicker="Patrones"
              title="Chasis de herramientas"
              lead={<>Toda herramienta se monta sobre las mismas cuatro piezas. <code>ToolHeader</code> tiene dos densidades: <code>page</code> (cabecera editorial: kicker, titular en cursiva, entradilla y métricas) y <code>bar</code> (la franja fija de 45px). <code>ToolBar</code> es la fila de controles que va debajo, <code>StatChip</code> la métrica de cabecera y <code>ToolSeal</code> el sello del icono.</>}
            >
              <Sample
                title="Cabecera de página"
                code={'<ToolHeader title sub meta>'}
                col
                note={<>La regla de densidad: <code>bar</code> si la herramienta tiene controles permanentes, ocupa el viewport o alberga rutas hijas; <code>page</code> en cualquier otro caso — y <code>page</code> desempata, porque una cabecera de página puede colgar un <code>ToolBar</code> fijo debajo mientras que una franja nunca puede hacerle sitio a un titular.</>}
              >
                <ToolHeader
                  title={<>Claves de <em>Steam</em></>}
                  sub="Catálogo de juegos que repartimos en la comunidad."
                  meta={
                    <>
                      <StatChip icon="layers" value={128} label="total" />
                      <StatChip icon="bookmark" value={41} label="disponibles" tone="ok" />
                      <StatChip icon="check" value={87} label="entregadas" tone="used" />
                    </>
                  }
                />
              </Sample>

              <Sample title="Cabecera de franja" code={'<ToolHeader density="bar" icon title sub>'} col>
                <div className="w-full border border-solid border-line">
                  <ToolHeader
                    density="bar"
                    icon="chart"
                    title="Meta VGC"
                    sub="Regulación H · 30 días"
                    meta={<StatChip icon="users" value="4 812" label="equipos" />}
                    className="static"
                  />
                </div>
              </Sample>

              <Sample
                title="Fila de controles"
                code={'<ToolBar filters note>'}
                col
                note={<>Orden canónico: búsqueda · seg · select · <code>ToolBarSpacer</code> · vista · una acción principal. Los chips de filtro van en <code>filters</code> (segunda fila) y el recuento en <code>note</code> (tercera): incrustados en la fila, ambos la reordenan cada vez que cambia el filtro.</>}
              >
                <div className="w-full">
                  <ToolBar
                    filters={
                      <>
                        <StatChip value={9} label="planta" />
                        <StatChip value={4} label="fuego" tone="accent" />
                      </>
                    }
                    note="Mostrando 60 de 1 284"
                  >
                    <SearchInput value="" onChange={() => {}} placeholder="Buscar carta…" className="min-w-[200px] flex-1" />
                    <Select value="num" onChange={() => {}} ariaLabel="Orden" className="w-auto min-w-[180px]" options={[{ value: "num", label: "Orden: Número" }]} />
                    <ToolBarSpacer />
                    <Seg value="m" onChange={() => {}} options={[{ value: "s", label: "S" }, { value: "m", label: "M" }, { value: "l", label: "L" }]} />
                  </ToolBar>
                </div>
              </Sample>

              <Sample title="Métrica y sello" code={'<StatChip variant> · <ToolSeal hue>'}>
                <StatChip icon="gift" value={12} label="gratis" tone="ok" />
                <StatChip icon="flame" value="48 €" label="ahorrado" tone="accent" />
                <StatChip variant="tile" value="1 284" label="archivos" />
                <ToolSeal icon="sword" />
                <ToolSeal icon="sword" hue="hsl(152 58% 56%)" />
                <ToolTitle title="Armería" sub="Monster Hunter Wilds" />
              </Sample>
            </Section>

            <Section
              id="geometria"
              kicker="Patrones"
              title="Geometría de corte"
              lead={<>Cada forma tiene un trabajo. Elegir la equivocada es el error de diseño más frecuente del sistema, porque las cuatro se ven «cortadas» y sólo una es correcta en cada sitio.</>}
            >
              <Sample
                title="Qué forma va en qué"
                code=".cut · .cut-corner · .cut-tag · .cut-seal"
                col
                note={<>Las diagonales no sobreviven a un <code>clip-path</code>: el recorte se come el borde CSS. Por eso cada forma va acompañada de su trazo (<code>-edge</code>), y el color hay que pasarlo por <code>--cut-line</code> además de por <code>border-*</code> — si sólo se cambia el borde, las diagonales se quedan en <code>--line</code> y la pieza parece medio delineada.</>}
              >
                <div className="grid w-full gap-3 sm:grid-cols-2">
                  {[
                    { cls: "cut cut-edge-slant [--cut:8px] [--cut-line:var(--line-2)]", name: ".cut", use: "Píldoras, botones, chips, badges" },
                    { cls: "cut-corner cut-corner-edge [--cut-line:var(--line-2)]", name: ".cut-corner", use: "Contenedores: paneles, tarjetas, barras — la firma del sistema" },
                    { cls: "cut-tag cut-tag-edge [--cut-line:var(--line-2)]", name: ".cut-tag", use: "Campos: input, select, textarea, búsqueda, sellos" },
                    { cls: "cut-seal cut-seal-edge [--cut-line:var(--line-2)]", name: ".cut-seal", use: "Avisos y tiras de notificación (Banner)" },
                  ].map((g) => (
                    <div key={g.name} className={`${g.cls} border border-solid border-line-2 bg-panel p-4`}>
                      <code className="font-mono text-[12px] font-semibold text-accent">{g.name}</code>
                      <p className="mt-1 text-[13px] leading-[1.45] text-txt-muted">{g.use}</p>
                    </div>
                  ))}
                </div>
              </Sample>
            </Section>

            <Section id="datos" kicker="Patrones" title="Datos">
              <Sample title="Ranking" code="<Rank> + <RankRow>" col>
                <Rank>
                  <RankRow rank="1" name="AxelCraft" team="Equipo Volt" pts="12 480" unit="pts" top3 />
                  <RankRow rank="2" name="NovaPixel" team="Equipo Aqua" pts="11 920" unit="pts" top3 />
                  <RankRow rank="4" name="Zenor" team="Equipo Volt" pts="9 815" unit="pts" />
                </Rank>
              </Sample>
              <Sample title="Tabla" code="<Table>" col>
                <Table
                  columns={[
                    { key: "player", label: "Jugador" },
                    { key: "game", label: "Juego" },
                    { key: "ach", label: "Logros" },
                    { key: "pts", label: "Puntos", numeric: true },
                  ]}
                  rows={[
                    { player: "RotomChef", game: "VGC", ach: <Badge tone="ok">31</Badge>, pts: "4 820" },
                    { player: "EnderQueen", game: "Minecraft", ach: <Badge tone="ok">28</Badge>, pts: "4 510" },
                    { player: "TeraBlast", game: "VGC", ach: <Badge tone="ok">26</Badge>, pts: "4 180" },
                  ]}
                />
              </Sample>
              <Sample title="Progreso" code="<Progress>" col>
                <div className="grid gap-[14px]">
                  <Progress value={62} />
                  <Progress value={28} />
                </div>
              </Sample>
              <Sample title="Lista de datos" code="<DataList rows>" col note={<>Pares etiqueta/valor para fichas y detalles; el valor va a la derecha, con opción <code>mono</code>, <code>icon</code> y filas <code>wide</code> a línea completa.</>}>
                <div className="w-full max-w-[440px]">
                  <DataList
                    rows={[
                      { label: "Formato", value: "Dobles VGC", icon: "gamepad" },
                      { label: "Regulación", value: "H" },
                      { label: "Plazas", value: "96 / 128", mono: true },
                      { label: "Objeto", value: "Sitrus Berry", icon: "star", mono: true },
                      { label: "Notas", value: "Lead de Incineroar + Flutter Mane para presionar Trick Room.", wide: true },
                    ]}
                  />
                </div>
              </Sample>
              <Sample title="Bloque de código" code="<CodeBlock lines label copyText scan>" col note={<>Bloque monoespaciado con cabecera y botón de copiar; <code>scan</code> añade el barrido de sintonización y <code>tone=&quot;accent&quot;</code> tiñe el texto.</>}>
                <div className="w-full max-w-[440px]">
                  <CodeBlock
                    label="Código · US / JP"
                    tone="accent"
                    scan
                    copyText="9F3K-2XQW-7T"
                    lines={["9F3K-2XQW-7T"]}
                  />
                </div>
              </Sample>
            </Section>

            <Section id="estados" kicker="Patrones" title="Estados">
              <Sample title="Estado vacío" code="<Empty>" col>
                <div className="border border-dashed border-line-2">
                  <Empty icon="calendar" title="Sin eventos" lead="Cuando haya eventos programados aparecerán aquí, con inscripción y cuenta atrás.">
                    <Button variant="pri" size="sm">
                      Sugerir un evento
                    </Button>
                  </Empty>
                </div>
              </Sample>
              <Sample title="Placeholder de imagen" code="<Ph>">
                <Ph label="key art — personajes wingull 2" style={{ width: 300, height: 140 }} />
              </Sample>
              <Sample title="Skeleton" code="<Skeleton w h avatar>" col note={<>La base genérica de carga que las herramientas especializan (listas, carátulas, huecos de equipo). Se detiene con reduce-motion.</>}>
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
    </>
  )
}
