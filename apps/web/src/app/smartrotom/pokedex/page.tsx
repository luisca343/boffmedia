import { getTranslations } from "next-intl/server"
import { HubSidebar } from "./_components/HubSidebar"
import { HubTopbar } from "./_components/HubTopbar"
import { ProgressStrip } from "./_components/ProgressStrip"
import { SpawnsCard } from "./_components/SpawnsCard"
import { RecentCard } from "./_components/RecentCard"
import { StreakCard } from "./_components/StreakCard"
import { GoalsCard } from "./_components/GoalsCard"

export default async function PokedexHub() {
  const t = await getTranslations("pokedex")

  return (
    <div className="flex h-full">
      <HubSidebar />

      <main className="flex-1 min-w-0 flex flex-col gap-[1.375rem] p-6 overflow-y-auto">
        <HubTopbar />
        <ProgressStrip />

        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-[1.375rem]">
          <SpawnsCard />
          <div className="flex flex-col gap-[1.375rem]">
            <RecentCard />
            <StreakCard />
            <GoalsCard />
          </div>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2 text-[0.6875rem] text-pk-surface-500 font-pk-mono">
          <span>v2.4.0 · a9c12f3</span>
          <span>{t("hub.footerCounts", { indexed: 905, generable: 21 })}</span>
        </div>
      </main>
    </div>
  )
}
