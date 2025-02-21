import { CardContent } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { EventTeam } from "@/types/events"
import { TeamCard } from "./TeamCard"
import { TeamEmptyState } from "./TeamEmptyState"

interface TeamsListProps {
  teams: EventTeam[]
  onEdit: (team: EventTeam) => void
  onDelete: (team: EventTeam) => void
}

export function TeamsList({ teams, onEdit, onDelete }: TeamsListProps) {
  if (teams.length === 0) {
    return (
      <CardContent>
        <TeamEmptyState />
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
              <TableHead className="text-surface-300">Equipo</TableHead>
              <TableHead className="text-surface-300">Tag</TableHead>
              <TableHead className="text-surface-300">Evento</TableHead>
              <TableHead className="text-surface-300">Puntuación</TableHead>
              <TableHead className="text-surface-300">Miembros</TableHead>
              <TableHead className="text-surface-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} onEdit={() => onEdit(team)} onDelete={() => onDelete(team)} />
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

