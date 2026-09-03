"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Empty, PageHead, SearchBar, Skeleton } from "../ui"
import { FilterTabs } from "./FilterTabs"
import { Pager } from "./Pager"
import { CiudadanoCard } from "./CiudadanoCard"
import { useCenso } from "../../_hooks/queries"
import type { Ciudadano } from "../../_types"

const PAGE_SIZE = 60

type StandingFilter = "all" | Ciudadano["standing"]

export function CensoBoard() {
  const t = useTranslations("gobierno")
  const [search, setSearch] = useState("")
  const [standing, setStanding] = useState<StandingFilter>("all")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCenso({
    page,
    limit: PAGE_SIZE,
    standing: standing === "all" ? undefined : standing,
  })

  // Live per-standing counts for the filter chips — three cheap `limit: 1` reads, real
  // totals off the same enriched endpoint (never a fabricated figure).
  const { data: buenoCount } = useCenso({ standing: "bueno", page: 1, limit: 1 })
  const { data: observadoCount } = useCenso({ standing: "observado", page: 1, limit: 1 })
  const { data: sancionadoCount } = useCenso({ standing: "sancionado", page: 1, limit: 1 })

  // The search box filters the currently loaded page client-side — there is no free-text
  // search parameter on any sibling register endpoint in this app (denuncias/buscados/
  // parcelas all filter by exact fields only), so this stays honest about its scope rather
  // than pretending to search the whole population.
  const rows = useMemo(() => {
    const items = data?.items ?? []
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter((c) => c.username.toLowerCase().includes(q))
  }, [data, search])

  const setStandingFilter = (v: StandingFilter) => {
    setStanding(v)
    setPage(1)
  }

  return (
    <div>
      <PageHead
        kicker={t("poblacion.censoKicker")}
        dep="poblacion"
        title={t("poblacion.censoTitle")}
        sub={t("poblacion.censoSub")}
        right={
          <Badge tone="poblacion" icon="users">
            {t("poblacion.habitantes", { count: data?.total ?? "—" })}
          </Badge>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="w-full max-w-[16.25rem]">
          <SearchBar value={search} onChange={setSearch} placeholder={t("poblacion.searchPagePlaceholder")} />
        </div>
        <FilterTabs
          value={standing}
          onChange={setStandingFilter}
          tone="poblacion"
          options={[
            { value: "all", label: t("poblacion.todos") },
            { value: "bueno", label: t("poblacion.buenaRep"), count: buenoCount?.total },
            { value: "observado", label: t("poblacion.observados"), count: observadoCount?.total },
            { value: "sancionado", label: t("poblacion.sancionados"), count: sancionadoCount?.total },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(15.5rem,1fr))]">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[8.25rem]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Empty
          icon="users"
          title={t("poblacion.emptyCenso")}
          sub={search ? t("poblacion.emptyCensoSearch") : t("poblacion.emptyCensoSub")}
        />
      ) : (
        <>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(15.5rem,1fr))]">
            {rows.map((c) => (
              <CiudadanoCard key={c.uuid} citizen={c} />
            ))}
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} t={t} />
        </>
      )}
    </div>
  )
}
