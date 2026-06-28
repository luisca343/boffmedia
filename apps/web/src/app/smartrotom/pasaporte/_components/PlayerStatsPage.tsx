import type { MinecraftStats } from "@/services/api/smartrotom/playerService"
import { Trophy, Skull, Footprints, DogIcon as Horse, SailboatIcon as Boat, Timer, Swords, Clock } from "lucide-react"

interface PlayerStatsProps {
  stats: MinecraftStats
  username: string
  uuid: string
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

export function PlayerStatsPage({ stats, username, uuid }: any) {
  const customStats = stats?.["minecraft:custom"] || {}
  const killedStats = stats?.["minecraft:killed"] || {}

  // Calculate total kills
  const totalKills = Object.values(killedStats).reduce((acc: number, val) => acc + (val as number), 0)

  // Convert ticks to hours and minutes (20 ticks per second)
  const playTimeMinutes = Math.floor(customStats["minecraft:play_one_minute"] / (20 * 60))
  const playTimeHours = Math.floor(playTimeMinutes / 60)
  const playTimeRemainingMinutes = playTimeMinutes % 60

  // Calculate total distance (in km) - combining different movement types
  const totalDistance =
    (customStats["minecraft:walk_one_cm"] +
      customStats["minecraft:sprint_one_cm"] +
      customStats["minecraft:horse_one_cm"] +
      customStats["minecraft:boat_one_cm"] +
      customStats["minecraft:swim_one_cm"]) /
    100000 // Convert to km

  return (
    <div className="flex flex-col h-full font-vinque">
      <div className="flex items-start space-x-6 mb-8 ml-4 pt-4">
        <div className="flex">
          <div style={{ width: "150px" }}>
            <img src={`https://crafatar.com/renders/body/${uuid}?overlay`} alt="description" />
          </div>
          <span className="text-xl font-bold">{username}</span>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="Tiempo de juego"
            value={`${playTimeHours}h ${playTimeRemainingMinutes}m`}
            subtitle="En el servidor"
          />

          <StatCard
            icon={<Trophy className="w-6 h-6" />}
            title="Victorias en Combate"
            value={totalKills}
            subtitle="Enemigos derrotados"
          />

          <StatCard
            icon={<Skull className="w-6 h-6" />}
            title="Muertes"
            value={customStats["minecraft:deaths"] || 0}
            subtitle="Veces caído en batalla"
          />

          <StatCard
            icon={<Footprints className="w-6 h-6" />}
            title="Distancia Recorrida"
            value={`${formatNumber(totalDistance)} km`}
            subtitle="A pie y nadando"
          />
        </div>
      </div>

      <div className="mt-8 space-y-4 px-4">
        <h3 className="text-xl font-bold border-b border-black/20 pb-2">Detalles de Movimiento</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <MovementStat
            icon={<Footprints className="w-4 h-4" />}
            label="Distancia a pie"
            value={formatDistance(customStats["minecraft:walk_one_cm"])}
          />
          <MovementStat
            icon={<Horse className="w-4 h-4" />}
            label="A caballo"
            value={formatDistance(customStats["minecraft:horse_one_cm"])}
          />
          <MovementStat
            icon={<Boat className="w-4 h-4" />}
            label="En bote"
            value={formatDistance(customStats["minecraft:boat_one_cm"])}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
}) {
  return (
    <div className="border border-black/20 rounded-lg p-4 bg-white/50">
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-ink-dim">{subtitle}</div>
    </div>
  )
}

function MovementStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  )
}

function formatDistance(cm = 0): string {
  const km = cm / 100000
  return `${formatNumber(km)} km`
}

