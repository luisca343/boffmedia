"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, Modal, toast } from "@/components/boffmedia/primitives"
import { MONO_LABEL, Sample, Section } from "../showcase-shared"
import { AV_CHART_C, DEMO_MEMBERS, DEMO_PIPELINE, aiCurve } from "../showcase-data"
import {
  AvAlert,
  AvKpi,
  AvKpis,
  AvLiveDot,
  AvMetric,
  AvMetrics,
  AvPanel,
  AvPill,
  AvSectionHead,
} from "@/app/(boffmedia)/admin/_components/ui/av-kit"
import {
  AvChartFrame,
  AvDataGrid,
  AvDist,
  AvGpuBar,
  AvLegend,
  AvPipeline,
  AvResourceRow,
  AvSplitBar,
  MemberRow,
  RowActions,
} from "@/app/(boffmedia)/admin/_components/ui/av-data"

export function AdminChapter() {
  const [confirm, setConfirm] = React.useState(false)
  return (
    <>
      <Section
        id="admkpi"
        kicker="Admin"
        title="KPI y métricas"
        lead={<>La sala de control se apoya en dos piezas de dato: la tarjeta <code>AvKpi</code> (barra de acento superior, cifra en display italic, pie con delta) y la rejilla compacta <code>AvMetrics</code> para constantes operativas.</>}
      >
        <Sample title="Tarjetas KPI" code="<AvKpis> · <AvKpi label value icon live foot>" col>
          <div className="w-full">
            <AvKpis>
              <AvKpi label="Miembros" value="412" icon="users" live foot={<AvPill tone="green">+18 esta semana</AvPill>} />
              <AvKpi label="Eventos activos" value="02" icon="trophy" foot={<AvPill tone="muted">8 en total</AvPill>} />
              <AvKpi label="Juegos" value="06" icon="gamepad" />
              <AvKpi label="Logros" value="48" icon="star" foot={<AvPill tone="accent">3 nuevos</AvPill>} />
            </AvKpis>
          </div>
        </Sample>
        <Sample title="Métricas compactas" code="<AvMetrics> · <AvMetric value label tone>" col>
          <div className="w-full">
            <AvMetrics>
              <AvMetric value="96" label="plazas" tone="accent" />
              <AvMetric value="147" label="inscritos" />
              <AvMetric value="73%" label="aforo" tone="pos" />
              <AvMetric value="-2" label="bajas" tone="neg" />
              <AvMetric value="12" label="equipos" />
            </AvMetrics>
          </div>
        </Sample>
      </Section>

      <Section
        id="admstatus"
        kicker="Admin"
        title="Estado y pipeline"
        lead={<>Píldoras en mono (<code>AvPill</code>) para toda situación operativa, con punto en vivo (<code>AvLiveDot</code>) para lo que está en directo, y la tira de <code>AvPipeline</code> que resume las fases del sistema de IA con estado (listo / activo / en cola). El tablero de IA es aspiracional — datos de ejemplo. [aplazado]</>}
      >
        <Sample title="Píldoras de estado" code="<AvPill tone icon>">
          <AvPill tone="green"><AvLiveDot />En curso</AvPill>
          <AvPill tone="amber">Pendiente</AvPill>
          <AvPill tone="accent">Destacado</AvPill>
          <AvPill tone="rose">Cerrado</AvPill>
          <AvPill tone="muted">Archivado</AvPill>
          <AvPill tone="default" icon="trophy">Torneo</AvPill>
        </Sample>
        <Sample title="Pipeline" code="<AvPipeline stages active onNav>" col>
          <div className="w-full">
            <AvPipeline stages={DEMO_PIPELINE} active="ai-pretrain" onNav={() => {}} />
          </div>
        </Sample>
      </Section>

      <Section
        id="admrow"
        kicker="Admin"
        title="Filas y miembros"
        lead={<>La fila de recurso (icono recortado + título + subtítulo mono + acciones) puebla todo el CRUD del Portal. <code>MemberRow</code> es su especialización para la moderación: avatar, roles, estado y acciones rápidas. Datos de ejemplo. [aplazado]</>}
      >
        <Sample title="Fila de recurso" code=".av-row + <RowActions>" col>
          <div className="grid w-full gap-2">
            <AvResourceRow
              icon="trophy"
              title={<>Torneo Wingull 2<AvPill tone="green"><AvLiveDot />En curso</AvPill></>}
              sub="VGC · Evento · 14 Jun 2026 · 96 insc."
              actions={<RowActions onEdit={() => {}} onDelete={() => {}} />}
            />
          </div>
        </Sample>
        <Sample title="Fila de miembro" code="<MemberRow member onView onMute onBan>" col>
          <div className="grid w-full gap-2">
            {DEMO_MEMBERS.map((m) => (
              <MemberRow key={m.id} member={m} onView={() => {}} onMute={() => {}} onBan={() => {}} />
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="admtable"
        kicker="Admin"
        title="Tabla y datos"
        lead={<><code>AvDataGrid</code> extiende la tabla del sistema con ordenación por columna: pulsa una cabecera ordenable para alternar asc / desc. Celdas alineadas a la derecha para cifras en mono.</>}
      >
        <Sample title="Tabla ordenable" code="<AvDataGrid columns rows>" col>
          <div className="w-full">
            <AvDataGrid
              columns={[
                { key: "name", label: "Pokémon", name: true, sortable: true },
                { key: "reg", label: "Regulación" },
                { key: "usage", label: "Uso", align: "right", sortable: true, sortValue: (r) => parseFloat(String(r.usage)) },
              ]}
              rows={[
                { id: 1, name: "Incineroar", reg: "Reg I", usage: "51.2%" },
                { id: 2, name: "Flutter Mane", reg: "Reg I", usage: "44.8%" },
                { id: 3, name: "Rillaboom", reg: "Reg I", usage: "38.1%" },
              ]}
            />
          </div>
        </Sample>
      </Section>

      <Section
        id="admchart"
        kicker="Admin"
        title="Gráficas y barras"
        lead={<>Toda la telemetría del control-room: <code>AvChartFrame</code> (líneas responsivas con ejes), <code>AvSplitBar</code> (victoria/derrota), <code>AvGpuBar</code> (utilización) y <code>AvDist</code> (distribución). Datos de ejemplo. [aplazado]</>}
      >
        <Sample title="Gráfica de líneas" code="<AvChartFrame lines yFmt xLabels>" col>
          <div className="w-full">
            <div className="mb-2.5">
              <AvLegend items={[{ label: "train", color: AV_CHART_C.train }, { label: "val", color: AV_CHART_C.val, dash: true }]} />
            </div>
            <AvChartFrame
              height={150}
              yMin={1.2}
              yMax={4.2}
              yFmt={(v) => v.toFixed(1)}
              xLabels={["0", "60k", "120k", "180k", "240k"]}
              lines={[
                { values: aiCurve(50, 4.1, 1.42, 0.05, 2), color: AV_CHART_C.train, width: 2.2 },
                { values: aiCurve(50, 4.0, 1.58, 0.06, 5), color: AV_CHART_C.val, width: 1.8, dashed: true },
              ]}
            />
          </div>
        </Sample>
        <Sample title="Barras" code="<AvSplitBar> · <AvGpuBar> · <AvDist>" col>
          <div className="grid w-full gap-4">
            <div className="flex items-center gap-3">
              <span className={cn(MONO_LABEL, "w-[90px] shrink-0")}>Win / loss</span>
              <div className="flex-1">
                <AvSplitBar win={73} loss={27} height={9} />
              </div>
            </div>
            <div>
              <AvGpuBar name="A100·0" pct={96} temp={71} />
              <AvGpuBar name="A100·1" pct={88} temp={66} />
            </div>
            <AvDist
              rows={[
                { label: "Scarlet/Violet", value: 2180000, color: "var(--accent)" },
                { label: "Champions", value: 214000, color: "var(--info)" },
                { label: "SwSh (legacy)", value: 106000, color: "var(--dim)" },
              ]}
            />
          </div>
        </Sample>
      </Section>

      <Section
        id="admpanel"
        kicker="Admin"
        title="Panel y cabecera"
        lead={<>El chasis denso de cada sección del portal: cabecera con título y acciones (<code>AvSectionHead</code>) y el panel de corte diagonal con cabecera de icono en mono (<code>AvPanel</code>).</>}
      >
        <Sample title="Cabecera de sección" code="<AvSectionHead title desc actions>" col>
          <div className="w-full">
            <AvSectionHead
              title="Eventos"
              desc="Crea, edita y publica los eventos de la comunidad. Se sincronizan con la clasificación y los logros."
              actions={<AvPill tone="accent" icon="plus">Nuevo evento</AvPill>}
            />
          </div>
        </Sample>
        <Sample title="Panel denso" code="<AvPanel title icon aside>" col>
          <div className="w-full">
            <AvPanel title="Resumen del torneo" icon="trophy" aside={<AvPill tone="green"><AvLiveDot />En curso</AvPill>}>
              <p className="text-txt-muted text-[14px]">El contenido de la sección vive aquí, con la esquina superior derecha en corte de 16px.</p>
            </AvPanel>
          </div>
        </Sample>
      </Section>

      <Section
        id="admfeedback"
        kicker="Admin"
        title="Avisos y diálogo"
        lead={<>La capa de feedback del portal: <code>AvAlert</code> en cuatro tonos, con barra de acento a la izquierda y corte de etiqueta. El toaster y el diálogo del handoff se cubren con los primitivos <code>toast()</code> y <code>Modal</code> del sistema.</>}
      >
        <Sample title="Alertas" code="<AvAlert tone title>" col>
          <div className="w-full grid gap-3">
            <AvAlert tone="info" title="Borrador sin publicar">Este evento no es visible para la comunidad hasta que lo publiques.</AvAlert>
            <AvAlert tone="success" title="Cambios guardados">La clasificación se recalculó con los nuevos resultados.</AvAlert>
            <AvAlert tone="warning" title="Faltan datos">Añade la fecha de inicio antes de publicar.</AvAlert>
            <AvAlert tone="error" title="No se pudo guardar">Revisa la conexión e inténtalo de nuevo.</AvAlert>
          </div>
        </Sample>
        <Sample title="Toast y diálogo" code="toast() · <Modal>" note={<>El toaster imperativo y el diálogo del handoff se cubren con los primitivos del sistema <code>toast()</code> y <code>Modal</code> (ya mostrados en Primitivas · Menús y avisos).</>}>
          <Button icon="bell" onClick={() => toast({ tone: "ok", title: "Cambios guardados", msg: "La clasificación se recalculó." })}>Lanzar aviso</Button>
          <Button variant="danger" icon="trash" onClick={() => setConfirm(true)}>Confirmar borrado</Button>
        </Sample>
      </Section>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirmar borrado" size="sm">
        <p className="text-[14px]/[1.5] text-txt-muted">
          ¿Seguro que quieres eliminar <strong className="text-txt">Torneo Wingull 2</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="mt-[18px] flex justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button
            variant="danger"
            size="sm"
            icon="trash"
            onClick={() => {
              setConfirm(false)
              toast({ tone: "bad", title: "Recurso eliminado", msg: "Torneo Wingull 2" })
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  )
}
