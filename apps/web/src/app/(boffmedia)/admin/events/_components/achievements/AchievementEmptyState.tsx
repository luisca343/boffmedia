import { Button } from "@/components/ui"
import { Award } from "lucide-react"

interface AchievementEmptyStateProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function AchievementEmptyState({ searchTerm, onClearSearch }: AchievementEmptyStateProps) {
  return (
    <div className="text-center py-12 text-surface-300">
      <Award className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
      <h3 className="text-xl font-medium text-surface-200 mb-2">No se encontraron logros</h3>
      <p className="max-w-md mx-auto">
        {searchTerm
          ? `No hay logros que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
          : "No hay logros registrados. Crea el primer logro para comenzar."}
      </p>
      {searchTerm && onClearSearch && (
        <Button variant="outline" className="mt-4 border-primary-500 text-primary-500" onClick={onClearSearch}>
          Limpiar búsqueda
        </Button>
      )}
    </div>
  )
}

