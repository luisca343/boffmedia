import { TableCell, TableRow } from "@/components/ui/primitives/table"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Pencil, Trash2, Users } from "lucide-react"
import type { EventTeam } from "@/types/events"

interface TeamCardProps {
  team: EventTeam
  onEdit: () => void
  onDelete: () => void
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  return (
    <TableRow className="border-surface-700 hover:bg-surface-700/50">
      <TableCell className="font-medium text-surface-400">#{team.id}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-700 flex items-center justify-center overflow-hidden">
            {team.icon ? (
              <img src={`/img/${team.icon}`} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="h-6 w-6 text-surface-500" />
            )}
          </div>
          <span className="font-medium text-surface-50">{team.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {team.tag ? (
          <Badge variant="outline" className="border-surface-600 text-surface-300">
            {team.tag}
          </Badge>
        ) : (
          <span className="text-surface-400">-</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-surface-50">{team.eventName}</span>
      </TableCell>
      <TableCell>
        <Badge className="bg-primary-500/20 text-primary-400 border-primary-500/30">
          {team.totalScore.toLocaleString()}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-surface-400" />
          <span className="text-surface-300">0</span>
        </div>
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

