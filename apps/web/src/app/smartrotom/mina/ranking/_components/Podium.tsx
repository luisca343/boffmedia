import { RankingEntry } from "@boffmedia/shared"
import { SmartRotomBadge } from "@/components/smartrotom/ui/badge"

interface PodiumProps {
  top3: (RankingEntry | undefined)[]
}

// Visual order: 2nd left, 1st centre (tallest), 3rd right
const SLOTS: { rank: 1 | 2 | 3; height: string }[] = [
  { rank: 2, height: "h-16" },
  { rank: 1, height: "h-24" },
  { rank: 3, height: "h-12" },
]

function PodiumSlot({
  entry,
  rank,
  height,
}: {
  entry: RankingEntry | undefined
  rank: 1 | 2 | 3
  height: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="flex flex-col items-center gap-1 pb-2">
        <SmartRotomBadge variant={rank === 1 ? "default" : "neutral"} className="font-bold">
          #{rank}
        </SmartRotomBadge>
        <p className="font-bold text-sm text-center max-w-[90px] truncate">
          {entry?.username ?? "—"}
        </p>
        {entry && (
          <div className="text-center text-xs text-gray-300 leading-relaxed">
            <p>{entry.totalValue} puntos</p>
            <p>{entry.gamesPlayed} partidas</p>
          </div>
        )}
      </div>
      <div
        className={`w-full ${height} border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.6)] flex items-center justify-center ${
          rank === 1 ? "bg-primary-500 bg-opacity-30" : "bg-white bg-opacity-10"
        }`}
      >
        <span className="text-3xl font-bold opacity-20 select-none">{rank}</span>
      </div>
    </div>
  )
}

export default function Podium({ top3 }: PodiumProps) {
  return (
    <div className="w-3/4 max-w-3xl mb-4">
      <p className="text-center text-xs font-bold tracking-[0.35em] mb-4 text-primary-500 uppercase">
        Top 3
      </p>
      <div className="flex items-end gap-2">
        {SLOTS.map(({ rank, height }) => (
          <PodiumSlot key={rank} entry={top3[rank - 1]} rank={rank} height={height} />
        ))}
      </div>
    </div>
  )
}
