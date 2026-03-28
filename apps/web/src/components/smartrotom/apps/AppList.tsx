"use client"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetAppsForPlayer } from "@/hooks/apps/useGetAppsForPlayer"
import AppGrid from "./AppGrid"
import { SmartRotomAppExtended } from "@/types"

export function AppList() {
  const { session } = useBoffSession()
  const { apps, setApps } = useGetAppsForPlayer(session?.user?.smartRotomUser?.uuid!)

  return <AppGrid apps={apps as SmartRotomAppExtended[]} setApps={setApps as (apps: SmartRotomAppExtended[]) => void} />
}