"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBoffSession } from "@/services/useBoffSession"
import { LoadingScreen } from "@/components/smartrotom/Loading"

// Client-side gate for /smartrotom/admin. Defense-in-depth + UX only — the
// authoritative check is the role guard on each /smartrotom admin endpoint.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { status, isRotomAdmin, isBoffAdmin } = useBoffSession()
  const allowed = isRotomAdmin() || isBoffAdmin()

  useEffect(() => {
    if (status !== "loading" && !allowed) {
      router.replace("/smartrotom")
    }
  }, [status, allowed, router])

  if (status === "loading" || !allowed) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
