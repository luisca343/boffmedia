"use client"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { useGetAppsForPlayer } from "@/hooks/apps/useGetAppsForPlayer"
import AppGrid from "./AppGrid"
import { SmartRotomAppExtended } from "@/types"

export function AppList() {
  const uuid = useRotomUuid()
  const { apps, setApps } = useGetAppsForPlayer(uuid!)

  return <AppGrid apps={apps as SmartRotomAppExtended[]} setApps={setApps as (apps: SmartRotomAppExtended[]) => void} />
}