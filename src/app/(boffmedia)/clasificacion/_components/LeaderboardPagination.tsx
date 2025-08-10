import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type LeaderboardPaginationProps = {
  currentPage: number
  totalPages: number
  totalPlayers: number
  playersPerPage: number
  setCurrentPage: (page: number) => void
}

export function LeaderboardPagination({
  currentPage,
  totalPages,
  totalPlayers,
  playersPerPage,
  setCurrentPage,
}: LeaderboardPaginationProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-surface-400 text-sm">
        Mostrando {(currentPage - 1) * playersPerPage + 1} - {Math.min(currentPage * playersPerPage, totalPlayers)} de{" "}
        {totalPlayers} jugadores
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="border-surface-600 text-surface-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1
            if (totalPages > 5) {
              if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className={
                  currentPage === pageNum ? "bg-primary-500 text-white" : "border-surface-600 text-surface-300"
                }
              >
                {pageNum}
              </Button>
            )
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-surface-500">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                className="border-surface-600 text-surface-300"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="border-surface-600 text-surface-300"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

