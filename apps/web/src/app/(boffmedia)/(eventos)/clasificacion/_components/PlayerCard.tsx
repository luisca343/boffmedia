import { TableCell, TableRow } from "@/components/ui/primitives/table"
import { Badge } from "@/components/ui"
import type { LeaderboardEntry } from "@boffmedia/shared"
import { ProfileImage } from "@/components/ui/ProfileImage"

type PlayerCardProps = {
  player: LeaderboardEntry
  rank: number | string
}

export function PlayerCard({ player, rank }: PlayerCardProps) {
  return (
    <TableRow key={player.userId}>
      <TableCell className="font-medium">
        <Badge variant={Number(rank) <= 3 ? "default" : "secondary"}>{rank}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ProfileImage userId={player.userId} size={32} />
          <span className="font-medium text-surface-50">{player.nickname || `Player ${player.userId}`}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">{player.totalPoints}</TableCell>
      <TableCell className="text-right">{player.medalCount}</TableCell>
      <TableCell className="text-right">{player.achievementCount}</TableCell>
    </TableRow>
  )
}

