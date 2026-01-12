"use client"

import { Button } from '@/components/ui/primitives/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  playersPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
}

export default function PaginationControls({ currentPage, totalPages, playersPerPage, totalItems, onPageChange }: PaginationControlsProps) {
  const t = useTranslations('boffmedia')

  const start = (currentPage - 1) * playersPerPage + 1
  const end = Math.min(currentPage * playersPerPage, totalItems)

  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (currentPage <= 3) return i + 1
    if (currentPage >= totalPages - 2) return totalPages - 4 + i
    return currentPage - 2 + i
  })

  return (
    <div className="bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-surface-400 text-sm">
          {t('eventsSection.leaderboard.showing', { start, end, total: totalItems, label: t('eventsSection.leaderboard.playersLabel') })}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="accentOutline"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'accent' : 'accentOutline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-surface-500">...</span>
                <Button
                  variant="accentOutline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="accentOutline"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
