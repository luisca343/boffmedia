"use client"

import { Sample, Section } from "../showcase-shared"
import { Badge } from "@/components/boffmedia/primitives/badge"
import { Button } from "@/components/boffmedia/primitives/button"
import { Empty } from "@/components/boffmedia/primitives/empty"
import { Panel } from "@/components/boffmedia/primitives/panel"
import { Ph } from "@/components/boffmedia/primitives/ph"
import { Progress } from "@/components/boffmedia/primitives/progress"
import { Rank, RankRow } from "@/components/boffmedia/primitives/rank-row"
import { Skeleton } from "@/components/boffmedia/primitives/skeleton"
import { Stats } from "@/components/boffmedia/primitives/stat"
import { Table } from "@/components/boffmedia/primitives/table"
import { Third } from "@/components/boffmedia/primitives/third"

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
