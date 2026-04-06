import { Button } from "@/components/ui"
import { Users } from "lucide-react"

interface TeamEmptyStateProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function TeamEmptyState({ searchTerm, onClearSearch }: TeamEmptyStateProps) {
  return (
    <div className="text-center py-12 text-surface-300">
      <Users className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
      <h3 className="text-xl font-medium text-surface-200 mb-2">No se encontraron equipos</h3>
      <p className="max-w-md mx-auto">
        {searchTerm
          ? `No hay equipos que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
          : "No hay equipos registrados. Crea el primer equipo para comenzar."}
      </p>
      {searchTerm && onClearSearch && (
        <Button variant="outline" className="mt-4 border-primary-500 text-primary-500" onClick={onClearSearch}>
          Limpiar búsqueda
        </Button>
      )}
    </div>
  )
}

