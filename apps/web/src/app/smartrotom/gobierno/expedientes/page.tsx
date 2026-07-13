"use client"

import { useEffect, useState } from "react"
import { PageHead, Button } from "../_components/ui"
import { ExpedienteList } from "../_components/justicia/ExpedienteList"
import { ExpedienteDetail } from "../_components/justicia/ExpedienteDetail"
import { NewExpedienteModal } from "../_components/justicia/NewExpedienteModal"
import { useExpedientes, useExpediente } from "../_hooks/queries"

const PAGE = { pageSize: 100 }

export default function ExpedientesPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)

  const { data, isLoading } = useExpedientes(PAGE)
  const items = data?.items ?? []

  useEffect(() => {
    if (selectedId == null && items.length > 0) setSelectedId(items[0].id)
  }, [items, selectedId])

  const { data: expediente, isLoading: isLoadingDetail } = useExpediente(selectedId)

  return (
    <>
      <PageHead
        kicker="Justicia · Expedientes"
        dep="justicia"
        title="Casos abiertos"
        sub="Cada infractor reúne sus denuncias, multas, órdenes de captura y apelaciones en un único expediente."
        right={
          <Button icon="plus" onClick={() => setShowNew(true)}>
            Abrir expediente
          </Button>
        }
      />

      {data && data.total > items.length && (
        <p className="mb-3 font-gt-mono text-[10.5px] text-gt-ink-400">
          Mostrando {items.length} de {data.total} expedientes.
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_1fr]">
        <ExpedienteList expedientes={items} isLoading={isLoading} selectedId={selectedId} onSelect={setSelectedId} />
        <ExpedienteDetail expediente={expediente ?? null} isLoading={isLoadingDetail && selectedId != null} />
      </div>

      <NewExpedienteModal open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}
