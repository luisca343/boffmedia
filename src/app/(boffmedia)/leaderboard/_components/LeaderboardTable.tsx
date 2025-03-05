import { Users, Medal, Award } from "lucide-react"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LeaderboardEntry } from "@/types/events"
import { PlayerCard } from "./PlayerCard"

type LeaderboardTableProps = {
  players: LeaderboardEntry[]
  getPlayerRank: (playerId: number) => number | string
}

export function LeaderboardTable({ players, getPlayerRank }: LeaderboardTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Posición</TableHead>
          <TableHead>Jugador</TableHead>
          <TableHead className="text-right">
            <Users className="inline-block mr-2" size={16} />
            Puntuación
          </TableHead>
          <TableHead className="text-right">
            <Medal className="inline-block mr-2" size={16} />
            Medallas
          </TableHead>
          <TableHead className="text-right">
            <Award className="inline-block mr-2" size={16} />
            Logros
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => (
          <PlayerCard key={player.userId} player={player} rank={getPlayerRank(player.userId)} />
        ))}
      </TableBody>
    </Table>
  )
}

