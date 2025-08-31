import { CardContent } from "@/components/ui/primitives/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import type { Achievement } from "@/types/events"
import { AchievementCard } from "./AchievementCard"
import { AchievementEmptyState } from "./AchievementEmptyState"

interface AchievementsListProps {
  achievements: Achievement[]
  onEdit: (achievement: Achievement) => void
  onDelete: (achievement: Achievement) => void
}

export function AchievementsList({ achievements, onEdit, onDelete }: AchievementsListProps) {
  if (achievements.length === 0) {
    return (
      <CardContent>
        <AchievementEmptyState />
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
              <TableHead className="text-surface-300">Logro</TableHead>
              <TableHead className="text-surface-300">Evento</TableHead>
              <TableHead className="text-surface-300">Puntos & Rareza</TableHead>
              <TableHead className="text-surface-300">Tipo & Categoría</TableHead>
              <TableHead className="text-surface-300">Completado</TableHead>
              <TableHead className="text-surface-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onEdit={() => onEdit(achievement)}
                onDelete={() => onDelete(achievement)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

