"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { Button } from "@/components/boffmedia/primitives/button"
import {
  SrtCard,
  SrtDrawReel,
  SrtFeatured,
  SrtOrganizer,
  SrtPrizeShowcase,
  SrtPrizeTag,
  SrtReqList,
  SrtRules,
  SrtSourceTag,
  SrtStatusChip,
  SrtSteps,
  SrtTicketMeter,
  SrtWinnerCard,
  srtOdds,
  srtStatus,
  type Sorteo,
} from "@/components/boffmedia/ui/giveaways"
import { SORTEOS_DB } from "./sorteos-demo"

const noop = () => {}

function ReelDemo({ sorteo }: { sorteo: Sorteo }) {
  const [phase, setPhase] = React.useState<"idle" | "spin" | "done">("done")
  return (
    <div className="w-full">
      <div className="mb-[14px]">
        <Button
          size="sm"
          icon="play"
          onClick={() => {
            setPhase("idle")
            setTimeout(() => setPhase("spin"), 40)
          }}
        >
          Reproducir sorteo
        </Button>
      </div>
      <SrtDrawReel sorteo={sorteo} spinning={phase === "spin"} revealed={phase === "done"} onLand={() => setPhase("done")} />
    </div>
  )
}

export function SorteosChapter() {
  const db = SORTEOS_DB
  const active = db.find((g) => srtStatus(g).key === "active") || db[0]
  const upcoming = db.find((g) => srtStatus(g).key === "upcoming") || db[0]
  const announced = db.find((g) => srtStatus(g).key === "announced") || db[0]
  const featured = db.find((g) => g.featured) || db[0]

  return (
    <>
      <Section
        id="srtstatus"
        kicker="Sorteos"
        title="Estado y organizador"
        lead={
          <>
            Los átomos del sorteo. <code>&lt;SrtStatusChip&gt;</code> cubre los cuatro estados del ciclo de vida (en curso, próximo, sorteando, ganador anunciado), cada uno con tratamiento propio. <code>&lt;SrtOrganizer&gt;</code>, <code>&lt;SrtSourceTag&gt;</code> y <code>&lt;SrtPrizeTag&gt;</code> etiquetan quién lo monta, de dónde salen los participantes y qué se lleva el ganador.
          </>
        }
      >
        <Sample title="Estados" code="<SrtStatusChip status>">
          <SrtStatusChip status={{ key: "active", label: "En curso", tone: "live" }} />
          <SrtStatusChip status={{ key: "upcoming", label: "Próximo", tone: "info" }} />
          <SrtStatusChip status={{ key: "ended", label: "Sorteando", tone: "muted" }} />
          <SrtStatusChip status={{ key: "announced", label: "Ganador anunciado", tone: "accent" }} />
        </Sample>
        <Sample title="Organizador y origen" code="<SrtOrganizer> · <SrtSourceTag>" note="El origen distingue la plataforma abierta: comunidad, viewers importados de Twitch o lista manual/CSV.">
          <SrtOrganizer organizer={{ name: "Boffmedia", avatar: "B", kind: "boffmedia" }} />
          <SrtOrganizer organizer={{ name: "Kiara", avatar: "K", kind: "streamer" }} />
          <SrtSourceTag source="comunidad" />
          <SrtSourceTag source="twitch" />
          <SrtSourceTag source="manual" />
        </Sample>
        <Sample title="Premio y probabilidad" code="<SrtPrizeTag> · <SrtTicketMeter>" col>
          <div className="mb-4 flex flex-wrap gap-2.5">
            <SrtPrizeTag type="merch" winners={1} />
            <SrtPrizeTag type="key" winners={10} />
            <SrtPrizeTag type="nitro" winners={3} />
          </div>
          <div className="w-full max-w-[320px]">
            <SrtTicketMeter tickets={4} max={10} odds={srtOdds(active, 4)} />
          </div>
        </Sample>
      </Section>

      <Section
        id="srtcard"
        kicker="Sorteos"
        title="Tarjeta de sorteo"
        lead={
          <>
            La pieza que puebla el descubridor. <code>&lt;SrtCard&gt;</code> lleva franja de premio con valor, estado, origen y pie contextual: cuenta atrás para los activos, ganador para los anunciados. Dos pieles: rejilla y lista (<code>layout="list"</code>). El rail y el glifo se tiñen con el hue del juego cuando el sorteo está ligado a uno.
          </>
        }
      >
        <Sample title="Rejilla" code="<SrtCard sorteo go>" col>
          <div className="grid w-full gap-4 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
            <SrtCard sorteo={active} onOpen={noop} />
            <SrtCard sorteo={announced} onOpen={noop} />
          </div>
        </Sample>
        <Sample title="Lista" code={`<SrtCard layout="list">`} col>
          <div className="grid w-full grid-cols-1 gap-4">
            <SrtCard sorteo={upcoming} layout="list" onOpen={noop} />
          </div>
        </Sample>
      </Section>

      <Section
        id="srtfeat"
        kicker="Sorteos"
        title="Sorteo destacado"
        lead={
          <>
            La cabecera del descubridor: <code>&lt;SrtFeatured&gt;</code> combina el arte del premio (un <code>&lt;image-slot&gt;</code>), el valor a la vista, estado, cuenta atrás y CTA. Domina la jerarquía visual cuando hay un sorteo estrella.
          </>
        }
      >
        <Sample title="Destacado" code="<SrtFeatured sorteo go>" col>
          <div className="w-full">
            <SrtFeatured sorteo={featured} onOpen={noop} />
          </div>
        </Sample>
      </Section>

      <Section
        id="srtprize"
        kicker="Sorteos"
        title="Escaparate de premio"
        lead={
          <>
            <code>&lt;SrtPrizeShowcase&gt;</code> da máximo protagonismo al premio: arte (image-slot), valor en display italic y el desglose de lo que incluye. Es el corazón de la página de detalle.
          </>
        }
      >
        <Sample title="Premio" code="<SrtPrizeShowcase sorteo>" col>
          <div className="w-full border border-solid border-line bg-panel [clip-path:polygon(0_0,calc(100%_-_14px)_0,100%_14px,100%_100%,0_100%)]">
            <div className="p-5">
              <SrtPrizeShowcase sorteo={featured} />
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="srtreqs"
        kicker="Sorteos"
        title="Requisitos y pasos"
        lead={
          <>
            La claridad de la elegibilidad y la participación. <code>&lt;SrtReqList&gt;</code> marca cada requisito como cumplido o pendiente; <code>&lt;SrtSteps&gt;</code> es la guía numerada paso a paso con hilo de progreso.
          </>
        }
      >
        <Sample title="Requisitos" code="<SrtReqList requirements>" col>
          <div className="w-full max-w-[460px]">
            <SrtReqList requirements={featured.requirements} />
          </div>
        </Sample>
        <Sample title="Pasos" code="<SrtSteps steps>" col>
          <div className="w-full max-w-[460px]">
            <SrtSteps steps={featured.steps} />
          </div>
        </Sample>
      </Section>

      <Section
        id="srtdraw"
        kicker="Sorteos"
        title="Sorteo y ganador"
        lead={
          <>
            La transparencia hecha componente. <code>&lt;SrtDrawReel&gt;</code> visualiza el sorteo ponderado: cada participante ocupa espacio proporcional a sus tickets y la aguja se detiene sobre el ganador — heredero del selector de ganadores del v2. <code>&lt;SrtWinnerCard&gt;</code> corona el resultado, y <code>&lt;SrtRules&gt;</code> cierra con las reglas y la semilla pública verificable.
          </>
        }
      >
        <Sample title="Tira del sorteo ponderado" code="<SrtDrawReel sorteo spinning revealed>" col note="Pulsa «Reproducir sorteo»: la tira acelera y frena sobre el ganador. La anchura de cada bloque = sus tickets.">
          <ReelDemo sorteo={announced} />
        </Sample>
        <Sample title="Ganador" code="<SrtWinnerCard sorteo>" col>
          <div className="w-full max-w-[460px]">
            <SrtWinnerCard sorteo={announced} />
          </div>
        </Sample>
        <Sample title="Reglas y semilla" code="<SrtRules rules seed>" col>
          <div className="w-full max-w-[560px]">
            <SrtRules rules={featured.rules} seed={featured.seed} />
          </div>
        </Sample>
      </Section>
    </>
  )
}
