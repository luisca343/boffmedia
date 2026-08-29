"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, Button, DropZone, FeatureToggle, Field, Icon, Input, Modal, PackListItem, ReleaseRow, SelectCard, toast, VersionCard, VersionRow } from "@boffmedia/ui"
import { MONO_LABEL, Sample, Section } from "../showcase-shared"
import { AV_CHART_C, DEMO_MEMBERS, DEMO_PIPELINE, aiCurve } from "../showcase-data"
import {
  AvAlert,
  AvAttention,
  AvKpi,
  AvKpis,
  AvLiveDot,
  AvMetric,
  AvMetrics,
  AvPanel,
  AvPill,
  AvSwitchRow,
  AvSectionHead,
  AvProgressBar,
  AvStickyBar,
  AvJobPanel,
  AvJobStatusPill,
  formatAdminDate,
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
        <Sample title="Ventanas" code="<AvSwitchRow label on reading hint action>" col note={<>Una ventana que el operador abre y cierra. El estado se imprime junto al control que lo cambia: un botón que dice «Cerrar» es una afirmación sobre el estado, y cuando era falsa no había dónde verlo.</>}>
          <div className="w-full max-w-[460px]">
            <AvSwitchRow label="Inscripción" on reading="Abierta" action={<Button size="sm">Cerrar</Button>} />
            <AvSwitchRow label="Check-in" on={false} reading="Cerrado" action={<Button size="sm">Abrir</Button>} />
            <AvSwitchRow label="Cupo" on reading="Abierto" hint="Cerrar el cupo deja fuera a quien no haya completado la entrada." action={<Button size="sm">Cerrar cupo</Button>} />
          </div>
        </Sample>
        <Sample title="Atención" code="<AvAttention items empty>" col note={<>Lo que necesita a una persona, cada cosa con el clic que empieza a arreglarla. La lista vacía también es un resultado y lo dice.</>}>
          <div className="w-full max-w-[560px] grid gap-4">
            <AvAttention
              items={[
                { id: 1, tone: "error", text: "2 partidas están en disputa.", action: { label: "Ver partidas", onClick: () => {} } },
                { id: 2, tone: "warning", text: "3 inscritos no han completado los pasos de entrada.", action: { label: "Ver participantes", onClick: () => {} } },
                { id: 3, tone: "info", text: "El cupo se cierra en 6 horas." },
              ]}
              empty="Todo en orden."
            />
            <AvAttention items={[]} empty="Todo en orden: nada requiere tu intervención ahora mismo." />
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

      <Section
        id="admjobs"
        kicker="Admin"
        title="Trabajos y progreso"
        lead={<>Componentes para operaciones de larga duración: <code>AvProgressBar</code> para el progreso visual, <code>AvJobStatusPill</code> para el estado, y <code>AvJobPanel</code> como panel estándar para un trabajo con progreso, estado y acciones.</>}
      >
        <Sample title="Barra de progreso" code="<AvProgressBar value max tone label>" col>
          <div className="w-full grid gap-4">
            <div>
              <p className="mb-2 text-xs text-txt-dim">Progreso (predeterminado)</p>
              <AvProgressBar value={65} max={100} label="65/100" />
            </div>
            <div>
              <p className="mb-2 text-xs text-txt-dim">En ejecución (accent)</p>
              <AvProgressBar value={42} max={100} tone="accent" label="42/100" />
            </div>
            <div>
              <p className="mb-2 text-xs text-txt-dim">Completado (verde)</p>
              <AvProgressBar value={100} max={100} tone="green" label="100/100" />
            </div>
            <div>
              <p className="mb-2 text-xs text-txt-dim">Error (rose)</p>
              <AvProgressBar value={23} max={100} tone="rose" label="Error en 23/100" />
            </div>
          </div>
        </Sample>
        <Sample title="Píldoras de estado de trabajo" code="<AvJobStatusPill status>" col>
          <div className="flex flex-wrap gap-2">
            <AvJobStatusPill status="idle" />
            <AvJobStatusPill status="queued" />
            <AvJobStatusPill status="running" />
            <AvJobStatusPill status="done" />
            <AvJobStatusPill status="error" />
            <AvJobStatusPill status="cancelled" />
          </div>
        </Sample>
        <Sample title="Panel de trabajo" code="<AvJobPanel title status progress actions>" col>
          <div className="w-full">
            <AvJobPanel
              title="Importar torneo"
              desc="Descargando decklists y agregando estadísticas de uso."
              status="running"
              progress={{ value: 28, max: 100, label: "28/100 descargas" }}
              actions={<Button variant="ghost" size="sm">Cancelar</Button>}
              meta={
                <AvMetric value="2m 14s" label="tiempo transcurrido" tone="accent" />
              }
            />
          </div>
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

      <Section
        id="packlistitem"
        kicker="Packs"
        title="PackListItem"
        lead={<><code>&lt;PackListItem&gt;</code> es un botón que muestra un paquete en formato de fila seleccionable — con media, nombre, slug, insignias y metadatos.</>}
      >
        <Sample title="Variantes selección y outline" code="PackListItem · bar|outline" col grid>
          <PackListItem
            selected
            variant="bar"
            media={<Icon name="cube" size={16} />}
            name="Minecraft: Java Edition"
            slug="minecraft-java"
            badges={
              <div className="flex gap-1">
                <Badge tone="ok">Instalado</Badge>
                <Badge>v1.21.1</Badge>
              </div>
            }
            count="4 versiones · 2 accesos"
          />
          <PackListItem
            variant="bar"
            media={<Icon name="cube" size={16} />}
            name="Modpack Custom"
            slug="modpack-custom"
            badges={<Badge tone="new">Beta</Badge>}
            count="1 versión · sin acceso"
          />
          <PackListItem
            selected
            variant="outline"
            media={<Icon name="cube" size={16} />}
            name="Fabric Server"
            slug="fabric-server"
            badges={
              <div className="flex gap-1">
                <Badge tone="live">En directo</Badge>
              </div>
            }
            count="2 versiones · 5 accesos"
          />
        </Sample>
      </Section>

      <Section
        id="versions"
        kicker="Packs"
        title="Versiones · Row y Card"
        lead={<><code>&lt;VersionRow&gt;</code> es una fila compacta con estado, versión, insignias y acciones. <code>&lt;VersionCard&gt;</code> es su variante de tarjeta estructurada con notas opcionales.</>}
      >
        <Sample title="VersionRow · estados" code="VersionRow · live|draft" col>
          <div className="w-full grid gap-3">
            <VersionRow
              status="live"
              statusIcon={<Icon name="check" size={16} />}
              version="1.21.1"
              badges={
                <div className="flex gap-1">
                  <Badge tone="ok">Publicada</Badge>
                  <Badge tone="live">Última</Badge>
                </div>
              }
              meta="Fabric 0.16 · 40 archivos"
              date="14 Jun 2026"
              actions={<Button variant="ghost" size="sm" icon="copy">Clonar</Button>}
            />
            <VersionRow
              status="draft"
              statusIcon={<Icon name="layers" size={16} />}
              version="1.21.2"
              badges={<Badge tone="new">Borrador</Badge>}
              meta="Fabric 0.17 · 42 archivos"
              date="18 Jun 2026"
              actions={
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" icon="edit">Editar</Button>
                  <Button variant="ghost" size="sm" icon="trash">Borrar</Button>
                  <Button variant="ghost" size="sm">Publicar</Button>
                </div>
              }
            />
          </div>
        </Sample>
        <Sample title="VersionCard · con notas" code="VersionCard · card variant" col grid>
          <VersionCard
            status="live"
            statusIcon={<Icon name="check" size={16} />}
            version="1.21.1"
            badges={
              <div className="flex gap-1">
                <Badge tone="ok">Publicada</Badge>
              </div>
            }
            meta="Fabric 0.16 · 40 archivos"
            notes="Cambios: mejor rendimiento, soporte para Sodium, correcciones de bugs."
            date="14 Jun 2026"
          />
          <VersionCard
            status="draft"
            statusIcon={<Icon name="layers" size={16} />}
            version="1.21.2"
            badges={<Badge tone="new">Borrador</Badge>}
            meta="Fabric 0.17"
            notes="WIP: testeando nuevos mods de calidad de vida."
            date="18 Jun 2026"
          />
        </Sample>
      </Section>

      <Section
        id="releases"
        kicker="Launcher"
        title="ReleaseRow"
        lead={<><code>&lt;ReleaseRow&gt;</code> es la fila del lanzador — versión, target (SO/arch), metadatos de archivo, hash, fecha y acciones de publicación.</>}
      >
        <Sample title="Publicadas y borradores" code="ReleaseRow · published|draft" col>
          <div className="w-full grid gap-3">
            <ReleaseRow
              published
              version="2.0.1"
              target="win-x64"
              meta="boffmedia-app.msi · 62 MB"
              hashShort="3af0c1…9e2"
              hashFull="3af0c1a8b2d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9e2"
              date="18 Jun 2026"
              actions={<Button variant="ghost" size="sm" icon="upload">Despublicar</Button>}
              onCopyHash={() => toast({ tone: "ok", title: "Hash copiado", msg: "SHA256 en el portapapeles" })}
              copyLabel="Copiar"
            />
            <ReleaseRow
              version="2.0.2"
              target="macOS-arm64"
              meta="boffmedia-app-arm64.dmg · 71 MB"
              hashShort="f2e1d0…c9b"
              hashFull="f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1"
              date="19 Jun 2026"
              actions={<Button variant="pri" size="sm" icon="upload">Publicar</Button>}
              onCopyHash={() => toast({ tone: "ok", title: "Hash copiado", msg: "SHA256 en el portapapeles" })}
              copyLabel="Copiar"
            />
          </div>
        </Sample>
      </Section>

      <Section
        id="featuretoggle"
        kicker="Admin"
        title="FeatureToggle"
        lead={<><code>&lt;FeatureToggle&gt;</code> activa/desactiva configuraciones — el cuerpo (children) se revela solo cuando está activado. Interactivo con estado local.</>}
      >
        <Sample title="Toggle con control de estado" code="FeatureToggle · controlled" col>
          <FeatureToggleSample />
        </Sample>
      </Section>

      <Section
        id="selectcard"
        kicker="Admin"
        title="SelectCard"
        lead={<><code>&lt;SelectCard&gt;</code> es una tarjeta seleccionable — check visual + título + descripción. Grupo de tres para selección múltiple o alternativa.</>}
      >
        <Sample title="Selección de opciones" code="SelectCard · selection group" col grid>
          <SelectCardGroup />
        </Sample>
      </Section>
    </>
  )
}

function FeatureToggleSample() {
  const [on, setOn] = React.useState(false)
  return (
    <FeatureToggle
      icon={<Icon name="shield" size={20} />}
      title="Whitelist de acceso"
      ariaLabel="Whitelist de acceso"
      description="Limita quién puede acceder a este paquete"
      on={on}
      onChange={setOn}
    >
      <Field className="mt-4">
        <label className="block text-[13px] font-medium text-txt-muted mb-2">Usuarios autorizados</label>
        <DropZone label="Subir lista de UUIDs" hint=".txt" loadedLabel="Archivo cargado" onPick={() => {}} className="mb-3" />
        <Input placeholder="O pega aquí una lista de UUIDs..." />
      </Field>
    </FeatureToggle>
  )
}

function SelectCardGroup() {
  const [selected, setSelected] = React.useState("fabric")
  return (
    <div className="grid gap-3 w-full">
      <SelectCard
        selected={selected === "fabric"}
        onChange={() => setSelected("fabric")}
        icon={<Icon name="cube" size={20} />}
        title="Fabric Loader"
        description="Modding framework ligero y rápido"
      />
      <SelectCard
        selected={selected === "forge"}
        onChange={() => setSelected("forge")}
        icon={<Icon name="layers" size={20} />}
        title="Forge"
        description="Ecosistema maduro de mods para Minecraft"
      />
      <SelectCard
        selected={selected === "neoforge"}
        onChange={() => setSelected("neoforge")}
        icon={<Icon name="layers" size={20} />}
        title="NeoForge"
        description="Continuación mantenida de Forge"
      />
    </div>
  )
}
