"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/smartrotom/Loading"
import { useOfficer } from "../_hooks/useOfficer"

/**
 * Second gate, on top of the Gobierno layout's own GOBIERNO-role check: Administración
 * needs ROTOM_ADMIN (or Boffmedia admin), not just the base GOBIERNO role — the same
 * boundary the old `/smartrotom/admin` app enforced, now nested one level deeper.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { status, isAdmin } = useOfficer()

  useEffect(() => {
    if (status !== "loading" && !isAdmin) router.replace("/smartrotom/gobierno")
  }, [status, isAdmin, router])

  if (status === "loading" || !isAdmin) return <LoadingScreen />

  // Rendered only past the ROTOM_ADMIN gate above, so its presence in the DOM is proof
  // the session was actually authorised — e2e asserts on it to catch a silent redirect.
  return (
    <div data-admin-surface="gobierno" className="contents">
      {children}
    </div>
  )
}
