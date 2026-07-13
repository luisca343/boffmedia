"use client"

import { useState } from "react"
import { PageHead, Empty, TableSkeleton } from "../_components/ui"
import { ApelacionesStats } from "../_components/justicia/ApelacionesStats"
import { ApelacionCard } from "../_components/justicia/ApelacionCard"
import { ResolveApelacionModal } from "../_components/justicia/ResolveApelacionModal"
import { useApelaciones } from "../_hooks/queries"
import type { Apelacion } from "../_types"

const PAGE = { pageSize: 100 }

export default function ApelacionesPage() {
  const [target, setTarget] = useState<Apelacion | null>(null)
  const [outcome, setOutcome] = useState<"upheld" | "overturned" | null>(null)

  const { data, isLoading } = useApelaciones(PAGE)
  const items = data?.items ?? []

  const openResolve = (a: Apelacion, o: "upheld" | "overturned") => {
    setTarget(a)
    setOutcome(o)
  }

  return (
    <>
      <PageHead
        kicker="Justicia · Recursos"
        dep="justicia"
        title="Apelaciones"
        sub="Recursos presentados por ciudadanos que impugnan una multa. Revisa los argumentos y resuelve."
      />

      {!isLoading && items.length > 0 && <ApelacionesStats apelaciones={items} />}

      {data && data.total > items.length && (
        <p className="mb-3 font-gt-mono text-[10.5px] text-gt-ink-400">
          Mostrando {items.length} de {data.total} apelaciones.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-gt border border-gt-line bg-gt-paper-0 p-4">
              <TableSkeleton rows={2} cols={3} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty
          icon="scale"
          title="Sin apelaciones presentadas"
          sub="Los recursos que impugnen una multa aparecerán aquí para su revisión."
        />
      ) : (
        <div className="space-y-3.5">
          {items.map((a) => (
            <ApelacionCard key={a.id} apelacion={a} onResolve={openResolve} />
          ))}
        </div>
      )}

      <ResolveApelacionModal
        target={target}
        outcome={outcome}
        onClose={() => {
          setTarget(null)
          setOutcome(null)
        }}
      />
    </>
  )
}
