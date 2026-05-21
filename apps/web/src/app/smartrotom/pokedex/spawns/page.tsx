"use client"
import { SpawnsCard } from "../_components/SpawnsCard"
import { HubSidebar } from "../_components/HubSidebar"
import { useTranslations } from "next-intl"

export default function Spawns() {
  const t = useTranslations("pokedex")

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500 mb-1.5">
            Explorar
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
