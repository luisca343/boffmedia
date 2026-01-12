"use client"

import { TableCell, TableRow } from "@/components/ui/primitives/table"
import { Button } from "@/components/ui/primitives/button"
import { Badge } from "@/components/ui/primitives/badge"
import { Pencil, Trash2, Award, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Achievement } from "@/types/events"

interface AchievementCardProps {
  achievement: Achievement
  onEdit: () => void
  onDelete: () => void
}

export function AchievementCard({ achievement, onEdit, onDelete }: any) {
  const t = useTranslations('boffmedia')
  return (
    <TableRow className="border-surface-700 hover:bg-surface-700/50">
      <TableCell className="font-medium text-surface-400">#{achievement.id}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-700 flex items-center justify-center overflow-hidden">
            {achievement.icon ? (
              <img src={achievement.icon} alt={achievement.name} className="w-full h-full object-cover" />
            ) : (
              <Award className="h-6 w-6 text-surface-500" />
            )}
          </div>
            <div>
            <span className="font-medium text-surface-50 block">{achievement.name}</span>
            <span className="text-sm text-surface-400">{achievement.description}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-surface-50">{achievement.eventName}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary-500/20 text-primary-400 border-primary-500/30">
            {t('admin.achievements.pointsLabel', { points: achievement.points })}
          </Badge>
          {achievement.rarity && (
            <Badge variant="outline" className={`text-xs ${
              achievement.rarity === 'diamond' ? 'border-cyan-500/30 text-cyan-400' :
              achievement.rarity === 'platinum' ? 'border-accent-500/30 text-accent-400' :
              achievement.rarity === 'gold' ? 'border-yellow-500/30 text-yellow-400' :
              achievement.rarity === 'silver' ? 'border-surface-400/30 text-surface-400' :
              'border-orange-500/30 text-orange-400'
            }`}>
              {achievement.rarity}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-secondary-500/30 text-secondary-400">
            {achievement.itemType}
          </Badge>
          <Badge variant="outline" className="text-xs border-surface-500/30 text-surface-400">
            {achievement.category}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-surface-400" />
          <span className="text-surface-300">{achievement.completedCount || 0}</span>
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

