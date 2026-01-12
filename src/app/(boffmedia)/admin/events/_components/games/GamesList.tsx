"use client"

import { CardContent } from "@/components/ui/primitives/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import type { Game } from "@/types/events"
import { GameCard } from "./GameCard"
import { GameEmptyState } from "./GameEmptyState"
import { useTranslations } from "next-intl"

interface GamesListProps {
  games: any[]
  onEdit: (game: Game) => void
  onDelete: (game: Game) => void
}

export function GamesList({ games, onEdit, onDelete }: GamesListProps) {
  const t = useTranslations('boffmedia')
  
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
              <TableHead className="text-surface-300">{t('admin.games.table.id')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.games.table.game')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.games.table.description')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.games.table.createdAt')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.games.table.actions')}</TableHead>
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

