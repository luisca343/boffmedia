"use client"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetAppsForPlayer } from "@/hooks/apps/useGetAppsForPlayer"
import AppGrid from "./AppGrid"

export function AppList() {
  const { session } = useBoffSession()
  const { apps, setApps } = useGetAppsForPlayer(session?.user?.smartRotomUser?.uuid!)
  
  return <AppGrid apps={apps} setApps={setApps} />
}