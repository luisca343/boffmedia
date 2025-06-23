import { CardContent } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Game } from "@/types/events"
import { GameCard } from "./GameCard"
import { GameEmptyState } from "./GameEmptyState"

interface GamesListProps {
  games: any[]
  onEdit: (game: Game) => void
  onDelete: (game: Game) => void
}

export function GamesList({ games, onEdit, onDelete }: GamesListProps) {
  if (games.length === 0) {
    return (
      <CardContent>
        <GameEmptyState />
      </CardContent>
    )
  }

  return (
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-surface-700">
              <TableHead className="text-surface-300">ID</TableHead>
              <TableHead className="text-surface-300">Juego</TableHead>
              <TableHead className="text-surface-300">Descripción</TableHead>
              <TableHead className="text-surface-300">Fecha Creación</TableHead>
              <TableHead className="text-surface-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <GameCard key={game.id} game={game} onEdit={() => onEdit(game)} onDelete={() => onDelete(game)} />
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

