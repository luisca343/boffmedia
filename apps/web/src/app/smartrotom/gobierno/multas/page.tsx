"use client"

import { useState } from "react"
import { PageHead, Button } from "../_components/ui"
import { StatusTabs } from "../_components/hacienda/StatusTabs"
import { MultaForm } from "../_components/hacienda/MultaForm"
import { MultasStats } from "../_components/hacienda/MultasStats"
import { MultasTable } from "../_components/hacienda/MultasTable"
import { ConfirmModal } from "../_components/hacienda/ConfirmModal"
import { useMultas, useCreateMulta, usePayMulta, useCancelMulta } from "../_hooks/queries"
import { money } from "../_utils/format"
import type { Multa } from "../_types"

// Fetches one generous page rather than building real pagination: this government is
// brand new and every register starts near-empty. If a department ever outgrows one
// page, the "Mostrando X de Y" note below is the honest signal to revisit this.
const PAGE = { pageSize: 200 }

export default function MultasPage() {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("all")
  const [payTarget, setPayTarget] = useState<Multa | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Multa | null>(null)

  const { data, isLoading } = useMultas(PAGE)
  const createMulta = useCreateMulta()
  const payMulta = usePayMulta()
  const cancelMulta = useCancelMulta()

  const all = data?.items ?? []
  const rows = filter === "all" ? all : all.filter((m) => m.status === filter)

  return (
    <>
      <PageHead
        kicker="Hacienda · Sanciones"
        dep="hacienda"
        title="Multas"
        sub="Sanciones económicas emitidas por la policía y la administración. La recaudación ingresa en la tesorería."
        right={
          <Button icon="plus" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cerrar" : "Emitir multa"}
          </Button>
        }
      />

      <MultasStats multas={all} />

      {showForm && (
        <MultaForm
          pending={createMulta.isPending}
          onSubmit={(values) =>
            createMulta.mutate(
              { player: values.player, reason: values.reason, amount: values.amount },
              { onSuccess: () => setShowForm(false) },
            )
          }
        />
      )}

      {data && data.total > all.length && (
        <p className="mb-3 font-gt-mono text-[10.5px] text-gt-ink-400">
          Mostrando {all.length} de {data.total} multas.
        </p>
      )}

      <div className="mb-3.5">
        <StatusTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todas", count: all.length },
            { value: "pending", label: "Pendientes", count: all.filter((m) => m.status === "pending").length },
            { value: "paid", label: "Pagadas", count: all.filter((m) => m.status === "paid").length },
            { value: "appealed", label: "Apeladas", count: all.filter((m) => m.status === "appealed").length },
            { value: "cancelled", label: "Anuladas", count: all.filter((m) => m.status === "cancelled").length },
          ]}
        />
      </div>

      <MultasTable multas={rows} isLoading={isLoading} onPay={setPayTarget} onCancel={setCancelTarget} />

      <ConfirmModal
        open={payTarget != null}
        onClose={() => setPayTarget(null)}
        onConfirm={() => payTarget && payMulta.mutate(payTarget.id, { onSuccess: () => setPayTarget(null) })}
        pending={payMulta.isPending}
        kicker="Cobro de multa"
        title={`Cobrar ${payTarget?.code ?? ""}`}
        confirmLabel="Cobrar"
        body={
          payTarget && (
            <>
              Se transferirán <strong className="tabular-nums">{money(payTarget.amount)} ₽</strong> desde la cuenta
              StarBank de <strong>{payTarget.player.username}</strong> a la Tesorería de Teras. Si el jugador no
              tiene fondos suficientes, el cobro fallará.
            </>
          )
        }
      />

      <ConfirmModal
        open={cancelTarget != null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMulta.mutate(cancelTarget.id, { onSuccess: () => setCancelTarget(null) })}
        pending={cancelMulta.isPending}
        kicker="Anulación de multa"
        title={`Anular ${cancelTarget?.code ?? ""}`}
        confirmLabel="Anular"
        tone="danger"
        body={
          cancelTarget && (
            <>
              La multa por <strong className="tabular-nums">{money(cancelTarget.amount)} ₽</strong> a{" "}
              <strong>{cancelTarget.player.username}</strong> quedará anulada y no podrá cobrarse.
            </>
          )
        }
      />
    </>
  )
}
