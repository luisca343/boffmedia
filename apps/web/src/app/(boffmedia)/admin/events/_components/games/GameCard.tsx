import { TableCell, TableRow } from "@/components/ui/primitives/table"
import { Button } from "@/components/ui"
import { Pencil, Trash2, Gamepad } from "lucide-react"
import type { Game } from "@boffmedia/shared"

interface GameCardProps {
  game: Game
  onEdit: () => void
  onDelete: () => void
}

export function GameCard({ game, onEdit, onDelete }: GameCardProps) {
  return (
    <TableRow className="border-surface-700 hover:bg-surface-700/50">
      <TableCell className="font-medium text-surface-400">#{game.id}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-700 flex items-center justify-center overflow-hidden">
            {game.icon ? (
              <img src={game.icon} alt={game.title} className="w-full h-full object-cover" />
            ) : (
              <Gamepad className="h-6 w-6 text-surface-500" />
            )}
          </div>
          <span className="font-medium text-surface-50">{game.title}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-md">
        <p className="text-surface-300 truncate">{game.description}</p>
      </TableCell>
      <TableCell>
        <span className="text-surface-300">{new Date(game.createdAt).toLocaleDateString()}</span>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8 border-surface-600" onClick={onEdit}>
            <Pencil className="h-4 w-4 text-primary-400" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 border-surface-600" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-warning-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

