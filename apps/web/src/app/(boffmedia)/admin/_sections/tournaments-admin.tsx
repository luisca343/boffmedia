"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ListAndCreate } from "./tournaments-admin/ListAndCreate"
import { Manage, MANAGE_TABS, type ManageTab } from "./tournaments-admin/Manage"

/**
 * List ⇄ manage, both in the URL (`?manage=<slug>&tab=<tab>`) so a tournament
 * page — and the tab within it — survives a reload and can be linked to.
 */
export function TournamentsAdmin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const manage = searchParams.get("manage")
  const rawTab = searchParams.get("tab")
  const tab: ManageTab = MANAGE_TABS.includes(rawTab as ManageTab) ? (rawTab as ManageTab) : "overview"

  const setParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) params.delete(k)
      else params.set(k, v)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return manage ? (
    <Manage
      slug={manage}
      tab={tab}
      onTab={(next) => setParams({ tab: next === "overview" ? null : next })}
      onBack={() => setParams({ manage: null, tab: null })}
    />
  ) : (
    <ListAndCreate onSelect={(slug) => setParams({ manage: slug, tab: null })} />
  )
}
