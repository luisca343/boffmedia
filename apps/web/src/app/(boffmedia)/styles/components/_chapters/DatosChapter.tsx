"use client"

import * as React from "react"
import { DEMO_SPRITE, DEMO_TEAM } from "../showcase-data"
import { Sample, Section } from "../showcase-shared"
import { Button } from "@/components/boffmedia/primitives/button"
import { Chip } from "@/components/boffmedia/primitives/chip"
import { DkApp, DkBar, DkBarList, DkBody, DkChip, DkCopy, DkEmpty, DkHeat, DkSearch, DkSeg, DkSelect, DkSkel, DkSkelList, DkSplit, DkSprite, DkStat, DkTable, DkTeam, DkTitle, DkTrend, DkType } from "@/components/boffmedia/ui/tools/datakit"

export function DatosChapter() {
  const [dkSeg, setDkSeg] = React.useState("uso")
  const [dkQ, setDkQ] = React.useState("")
  const [dkReg, setDkReg] = React.useState("H")
  return (
    <>
            <Section id="dkpiezas" kicker="Datos en vivo" title="Sprites y jugador" lead={<>Piezas de identidad de los datos: chip de sprite agnóstico (<code>DkSprite</code>, el llamador controla la URL) y la fila de equipo (<code>DkTeam</code>). El chasis vive en <code>DkApp</code>/<code>DkBar</code>/<code>DkBody</code>.</>}>
              <Sample title="Sprite" code="<DkSprite src>">
                <DkSprite src={DEMO_SPRITE} alt="" title="Incineroar" />
                <DkSprite src={DEMO_SPRITE} alt="" size={40} />
                <DkSprite src={DEMO_SPRITE} alt="" dim />
              </Sample>
              <Sample title="Equipo" code="<DkTeam slots>">
                <DkTeam slots={DEMO_TEAM} />
              </Sample>
              <Sample title="Chasis" code="<DkApp> · <DkBar> · <DkBody>" col note={<>El armazón de altura completa: barra pegajosa (<code>DkBar</code>), título/atrás (<code>DkTitle</code>) y cuerpo con scroll propio (<code>DkBody</code>).</>}>
                <div className="w-full h-[220px] overflow-hidden border border-solid border-line">
                  <DkApp>
                    <DkBar>
                      <DkTitle icon="trophy" label="Meta VGC" sub="Regulación H" />
                    </DkBar>
                    <DkBody>
                      <p className="text-txt-muted text-[13px]">Contenido del cuerpo con scroll propio.</p>
                    </DkBody>
                  </DkApp>
                </div>
              </Sample>
            </Section>

            <Section id="dktabla" kicker="Datos en vivo" title="Tabla de datos" lead={<>Tabla ordenable (<code>DkTable</code>): cabecera pegajosa, columnas con alineación y orden, ganchos de celda <code>mono</code> e <code>is-click</code>. El llamador escribe <code>&lt;tbody&gt;/&lt;tr&gt;/&lt;td&gt;</code> planos.</>}>
              <Sample title="Ranking de uso" code="<DkTable columns>" col>
                <DkTable
                  columns={[
                    { key: "mon", label: "Pokémon" },
                    { key: "use", label: "Uso", align: "right", sortable: true },
                    { key: "lead", label: "Lead", align: "right" },
                  ]}
                  sortKey="use"
                  sortDir="desc"
                  onSort={() => {}}
                >
                  <tbody>
                    <tr className="is-click"><td>Incineroar</td><td className="mono" style={{ textAlign: "right" }}>58.2%</td><td className="mono" style={{ textAlign: "right" }}>21.0%</td></tr>
                    <tr className="is-click"><td>Flutter Mane</td><td className="mono" style={{ textAlign: "right" }}>54.9%</td><td className="mono" style={{ textAlign: "right" }}>33.4%</td></tr>
                    <tr className="is-click"><td>Rillaboom</td><td className="mono" style={{ textAlign: "right" }}>41.7%</td><td className="mono" style={{ textAlign: "right" }}>18.2%</td></tr>
                  </tbody>
                </DkTable>
              </Sample>
            </Section>

            <Section id="dkfiltros" kicker="Datos en vivo" title="Filtros y búsqueda" lead={<>Controles de datos: segmentado con contador (<code>DkSeg</code>), búsqueda (<code>DkSearch</code>), chip mono (<code>DkChip</code>) y selector compacto (<code>DkSelect</code>). Todos con el corte inferior derecho del datakit.</>}>
              <Sample title="Segmentado" code="<DkSeg options value onChange>">
                <DkSeg value={dkSeg} onChange={setDkSeg} options={[{ value: "uso", label: "Uso", count: 128 }, { value: "leads", label: "Leads", count: 64 }, { value: "cores", label: "Parejas", count: 32 }]} />
              </Sample>
              <Sample title="Búsqueda y selector" code="<DkSearch> · <DkSelect>">
                <DkSearch value={dkQ} onChange={setDkQ} placeholder="Buscar especie…" />
                <DkSelect value={dkReg} onChange={setDkReg} options={[{ value: "H", label: "Regulación H" }, { value: "G", label: "Regulación G" }, { value: "F", label: "Regulación F" }]} />
              </Sample>
              <Sample title="Chip" code="<DkChip>">
                <DkChip icon="trophy" tone="accent">Top cut</DkChip>
                <DkChip>128 equipos</DkChip>
              </Sample>
            </Section>

            <Section id="dkindicadores" kicker="Datos en vivo" title="Indicadores" lead={<>KPIs y barras: tarjeta de estadística por tono (<code>DkStat</code>), barra victoria/empate/derrota (<code>DkSplit</code>), barras etiquetadas (<code>DkBarList</code>), badge de tipo (<code>DkType</code>) y copiar (<code>DkCopy</code>).</>}>
              <Sample title="KPI por tono" code="<DkStat tone>">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                  <DkStat value="128" label="Partidas" />
                  <DkStat value="64%" label="Victorias" tone="pos" />
                  <DkStat value="1820" label="ELO" tone="accent" />
                  <DkStat value="-3" label="Racha" tone="neg" />
                </div>
              </Sample>
              <Sample title="Ratio y barras" code="<DkSplit> · <DkBarList>" col>
                <div className="w-full max-w-[420px]"><DkSplit win={64} draw={4} loss={32} rate={64} /></div>
                <div className="w-full max-w-[420px]">
                  <DkBarList items={[
                    { name: "Protect", pct: 100 },
                    { name: "Fake Out", pct: 78 },
                    { name: "Trick Room", pct: 41 },
                  ]} />
                </div>
              </Sample>
              <Sample title="Tipo y copiar" code="<DkType> · <DkCopy>">
                <DkType type="fire" />
                <DkType type="water" />
                <DkType type="grass" small />
                <DkCopy text="Incineroar @ Sitrus Berry" label="Copiar set" copiedLabel="¡Copiado!" />
              </Sample>
            </Section>

            <Section id="dkgraficas" kicker="Datos en vivo" title="Gráficas" lead={<>Gráficas en SVG en línea (cliente, medidas con <code>ResizeObserver</code>): progresión multilínea (<code>DkTrend</code>) con línea base y puntos por resultado, y mapa de calor de actividad (<code>DkHeat</code>).</>}>
              <Sample title="Progresión" code="<DkTrend lines baseline>" col>
                <div className="w-full">
                  <DkTrend
                    baseline={1500}
                    lines={[{ values: [1500, 1540, 1520, 1580, 1620, 1600, 1660, 1700], dots: ["win", "win", "loss", "win", "win", "loss", "win", "win"] }]}
                  />
                </div>
              </Sample>
              <Sample title="Mapa de calor" code="<DkHeat rows cols value>" col>
                <div className="w-full">
                  <DkHeat
                    rows={["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]}
                    cols={["0", "4", "8", "12", "16", "20"]}
                    max={9}
                    value={(r, c) => (r * 3 + c * 2) % 10}
                  />
                </div>
              </Sample>
            </Section>

            <Section id="dkestadosvivo" kicker="Datos en vivo" title="Carga y avisos" lead={<>Estados del datakit: caja vacía discontinua (<code>DkEmpty</code>) y esqueletos de carga (<code>DkSkel</code> · <code>DkSkelList</code>).</>}>
              <Sample title="Vacío" code="<DkEmpty>" col>
                <DkEmpty icon="inbox" title="Sin partidas todavía" lead="Registra tu primera sesión para ver estadísticas.">
                  <Button size="sm" variant="pri">Nueva sesión</Button>
                </DkEmpty>
              </Sample>
              <Sample title="Esqueletos" code="<DkSkel> · <DkSkelList>" col>
                <DkSkel />
                <DkSkelList rows={3} />
              </Sample>
            </Section>
    </>
  )
}
