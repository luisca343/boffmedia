"use client"

import { CardContent } from "@/components/ui/primitives/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import type { EventTeam } from "@/types/events"
import { TeamCard } from "./TeamCard"
import { TeamEmptyState } from "./TeamEmptyState"
import { useTranslations } from "next-intl"

interface TeamsListProps {
  teams: any[]
  onEdit: (team: EventTeam) => void
  onDelete: (team: EventTeam) => void
}

export function TeamsList({ teams, onEdit, onDelete }: TeamsListProps) {
  const t = useTranslations('boffmedia')
  
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
              <TableHead className="text-surface-300">{t('admin.teams.table.id')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.teams.table.team')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.teams.table.tag')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.teams.table.event')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.teams.table.score')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.teams.table.members')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.teams.table.actions')}</TableHead>
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

