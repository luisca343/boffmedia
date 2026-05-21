"use client"
import { SpawnsCard } from "../_components/SpawnsCard"
import { HubSidebar } from "../_components/HubSidebar"
import { useTranslations } from "next-intl"
import { MapPinIcon } from "@heroicons/react/24/outline"

export default function Spawns() {
  const t = useTranslations("pokedex")

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2 mb-1">
            <span className="icon w-5 h-5 rounded bg-primary-400/[0.12] text-primary-300 grid place-items-center">
              <MapPinIcon className="w-3 h-3" />
            </span>
            <span className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500">
              01 · Explorar
            </span>
          </div>
          <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50 mb-1.5">
            {t("spawns_title")}
          </h1>
          <p className="text-surface-400 text-[13.5px]">{t("spawns_sub")}</p>
        </div>
        <div className="flex-1 p-6">
          <SpawnsCard />
        </div>
      </main>
    </div>
  )
}
