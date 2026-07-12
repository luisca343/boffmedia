import { HubSidebar } from "./_components/HubSidebar"
import { HubTopbar } from "./_components/HubTopbar"
import { ProgressStrip } from "./_components/ProgressStrip"
import { SpawnsCard } from "./_components/SpawnsCard"
import { RecentCard } from "./_components/RecentCard"
import { StreakCard } from "./_components/StreakCard"
import { GoalsCard } from "./_components/GoalsCard"

export default function PokedexHub() {
  return (
    <div className="flex h-full">
      <HubSidebar />

      <main className="flex-1 min-w-0 flex flex-col gap-[22px] p-6 overflow-y-auto">
        <HubTopbar />
        <ProgressStrip />

        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-[22px]">
          <SpawnsCard />
          <div className="flex flex-col gap-[22px]">
            <RecentCard />
            <StreakCard />
            <GoalsCard />
          </div>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2 text-[11px] text-pk-surface-500 font-pk-mono">
          <span>v2.4.0 · a9c12f3</span>
          <span>905 indexados · 21 generables</span>
        </div>
      </main>
    </div>
  )
}
