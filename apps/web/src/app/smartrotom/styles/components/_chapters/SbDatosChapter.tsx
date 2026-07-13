"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  AreaChart,
  BarChart,
  Button,
  Card,
  CardBody,
  CategoryChip,
  Donut,
  Ico,
  Kpi,
  SectionHead,
  Seg,
  Sheet,
  Skeleton,
  Sparkline,
  Stepper,
  toast,
  ToastHost,
  type SegOption,
} from "@/app/smartrotom/starbank/_components/ui"
import { TxRow } from "@/app/smartrotom/starbank/_components/TxRow"
import { SB_ACCOUNT_ID, SB_BALANCE_SERIES, SB_BARS, SB_DONUT, SB_SPARK, SB_SPEND_BY_CATEGORY, SB_TXS } from "./sb-demo"

const RANGE_OPTIONS: SegOption[] = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "12m", label: "12 meses" },
]

const FLOW_OPTIONS: SegOption[] = [
  { id: "all", label: "Todo" },
  { id: "in", label: "Ingresos" },
  { id: "out", label: "Gastos" },
]

const STEPS = ["Destinatario", "Importe", "Confirmar"]

export function SbDatosChapter() {
  const [range, setRange] = React.useState("30d")
  const [flow, setFlow] = React.useState("all")
  const [step, setStep] = React.useState(1)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  return (
    <>
      <Section
        id="sb-kpi"
        kicker="Starbank"
        title="KPI"
        lead={
          <>
            La fila de cifras de cabecera. El <code>delta</code> se pinta solo (verde arriba, rojo abajo) y el
            valor siempre en <code>font-sb-display</code> con cifras tabulares.
          </>
        }
      >
        <Sample app="sb" title="Rejilla de KPIs" code="<Kpi label value sub delta icon tone>" col>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Saldo total" value="128.400 ¥" sub="2 cuentas" delta={4.2} icon="card" tone="brand" />
            <Kpi label="Ingresos" value="24.600 ¥" sub="este mes" delta={12.8} icon="arrDR" tone="pos" />
            <Kpi label="Gastos" value="12.900 ¥" sub="este mes" delta={-6.1} icon="arrUR" tone="neg" />
            <Kpi label="Pendiente" value="1.500 ¥" sub="1 recibo" icon="alert" tone="warn" />
          </div>
        </Sample>
      </Section>

      <Section
        id="sb-graficas"
        kicker="Starbank"
        title="Gráficas"
        lead={
          <>
            Cuatro piezas SVG propias, sin librería: <code>Sparkline</code> para la tendencia mínima,{" "}
            <code>AreaChart</code> para el saldo con cursor, <code>BarChart</code> para ingreso vs gasto y{" "}
            <code>Donut</code> para el reparto por categoría. Los colores de las series son hex crudos —
            un <code>fill</code> de SVG no admite una utilidad de Tailwind.
          </>
        }
      >
        <Sample app="sb" title="Sparkline" code="<Sparkline data height color>" col>
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Card>
              <SectionHead title="Saldo" eyebrow="12 semanas" />
              <CardBody>
                <div className="font-sb-display text-[22px] font-semibold tabular-nums text-sb-fg">128.400 ¥</div>
                <Sparkline data={SB_SPARK} height={60} />
              </CardBody>
            </Card>
            <Card>
              <SectionHead title="Sin área" eyebrow="showArea = false" />
              <CardBody>
                <div className="font-sb-display text-[22px] font-semibold tabular-nums text-sb-fg">+ 47 %</div>
                <Sparkline data={SB_SPARK} height={60} color="#047857" showArea={false} strokeWidth={2.5} />
              </CardBody>
            </Card>
          </div>
        </Sample>

        <Sample
          app="sb"
          title="Área"
          code="<AreaChart data height>"
          col
          note={
            <>
              Pasa el ratón por encima: la línea guía, el punto y el tooltip son parte de la primitiva. El eje
              se puede quitar con <code>showAxis = false</code> cuando la gráfica es un fondo.
            </>
          }
        >
          <Card className="w-full">
            <SectionHead
              title="Evolución del saldo"
              eyebrow="Últimos 30 días"
              action={<Seg options={RANGE_OPTIONS} value={range} onChange={setRange} />}
            />
            <CardBody>
              <AreaChart data={SB_BALANCE_SERIES} height={240} />
            </CardBody>
          </Card>
        </Sample>

        <Sample app="sb" title="Barras y donut" code="<BarChart> · <Donut>" col>
          <div className="grid w-full gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <SectionHead title="Ingresos y gastos" eyebrow="Por mes" />
              <CardBody>
                <BarChart data={SB_BARS} height={220} />
                <div className="flex items-center gap-4 text-[12px] text-sb-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="size-2 rounded-full bg-sb-pos-2" /> Ingresos
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <i className="size-2 rounded-full bg-sb-neg-2" /> Gastos
                  </span>
                </div>
              </CardBody>
            </Card>
            <Card>
              <SectionHead title="Gasto por categoría" eyebrow="Este mes" />
              <CardBody className="items-center">
                <Donut data={SB_DONUT} size={200} thickness={22} />
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SB_SPEND_BY_CATEGORY.map(({ category }) => (
                    <CategoryChip key={category.id} category={category} />
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </Sample>
      </Section>

      <Section
        id="sb-transacciones"
        kicker="Starbank"
        title="Transacciones"
        lead={
          <>
            La fila es la unidad del banco: contraparte, concepto, categoría deducida del texto, importe con
            signo y fecha relativa. El signo sale de <code>activeAccountId</code>, no de un campo del API —
            la misma transacción es gasto para uno e ingreso para el otro.
          </>
        }
      >
        <Sample app="sb" title="Lista" code="<TxRow tx activeAccountId onClick>" col padded={false}>
          <Card className="w-full rounded-none border-0">
            <SectionHead
              title="Movimientos"
              eyebrow="Cuenta principal"
              action={
                <Button variant="ghost" size="sm">
                  Ver todo <Ico name="arrR" size={14} />
                </Button>
              }
            />
            <CardBody noPad className="pt-2">
              {SB_TXS.map((tx) => (
                <TxRow key={tx.date} tx={tx} activeAccountId={SB_ACCOUNT_ID} onClick={() => setSheetOpen(true)} />
              ))}
            </CardBody>
          </Card>
        </Sample>
      </Section>

      <Section
        id="sb-navegacion"
        kicker="Starbank"
        title="Segmentos y pasos"
        lead={
          <>
            <code>Seg</code> filtra sin recargar (rango, tipo, cuenta); <code>Stepper</code> gobierna los
            flujos de varios pasos, como el envío de dinero.
          </>
        }
      >
        <Sample app="sb" title="Segmentos" code="<Seg options value onChange>" col>
          <div className="flex flex-wrap items-center gap-4">
            <Seg options={RANGE_OPTIONS} value={range} onChange={setRange} />
            <Seg options={FLOW_OPTIONS} value={flow} onChange={setFlow} />
          </div>
        </Sample>

        <Sample
          app="sb"
          title="Pasos"
          code="<Stepper steps current>"
          col
          note={
            <>
              Los pasos completados se marcan en verde <code>sb-pos</code>, el activo en azul de marca y los
              futuros en gris. El conector hereda ese mismo estado.
            </>
          }
        >
          <div className="w-full">
            <Stepper steps={STEPS} current={step} />
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                <Ico name="arrL" size={14} /> Atrás
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Siguiente <Ico name="arrR" size={14} />
              </Button>
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="sb-estados"
        kicker="Starbank"
        title="Carga y avisos"
        lead={
          <>
            El esqueleto imita la forma real de la tarjeta, nunca un rectángulo genérico. El{" "}
            <code>Sheet</code> saca el detalle sin abandonar la lista y el toast confirma la acción y
            desaparece a los 2,2 s.
          </>
        }
      >
        <Sample app="sb" title="Esqueleto" code="<Skeleton className>" col>
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-[60px] w-full" />
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-3 w-32" />
              </CardBody>
            </Card>
          </div>
        </Sample>

        <Sample
          app="sb"
          title="Sheet y toast"
          code="<Sheet> · toast()"
          note={
            <>
              El <code>Sheet</code> se monta como capa fija sobre toda la ventana (ciérralo con{" "}
              <code>Esc</code> o pulsando el velo). <code>ToastHost</code> vive una sola vez en el layout; los
              componentes sólo llaman a <code>toast()</code>.
            </>
          }
        >
          <Button variant="primary" onClick={() => setSheetOpen(true)}>
            <Ico name="receipt" size={16} /> Abrir detalle
          </Button>
          <Button variant="secondary" onClick={() => toast("Transferencia enviada")}>
            <Ico name="check" size={16} /> Lanzar aviso
          </Button>

          {sheetOpen && (
            <Sheet title="Premio torneo Wingull" eyebrow="Ingreso · Hoy" onClose={() => setSheetOpen(false)}>
              <div className="font-sb-display text-[32px] font-semibold tabular-nums text-sb-pos">+ 12.500 ¥</div>
              <div className="grid gap-3">
                {(
                  [
                    ["Contraparte", "Liga Pokémon"],
                    ["Concepto", "Premio torneo Wingull"],
                    ["Saldo tras el movimiento", "128.400 ¥"],
                  ] as const
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-4 border-b border-sb-border pb-3 text-[13.5px] last:border-b-0"
                  >
                    <span className="text-sb-fg-muted">{k}</span>
                    <span className="font-semibold tabular-nums text-sb-fg">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <CategoryChip category={SB_SPEND_BY_CATEGORY[1].category} />
                <Button variant="secondary" size="sm" onClick={() => toast("Recibo descargado")}>
                  <Ico name="download" size={14} /> Descargar recibo
                </Button>
              </div>
            </Sheet>
          )}
          <ToastHost />
        </Sample>
      </Section>
    </>
  )
}
