import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface EventEmptyStateProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function EventEmptyState({ searchTerm, onClearSearch }: EventEmptyStateProps) {
  return (
    <div className="text-center py-12 text-surface-300">
      <Calendar className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
      <h3 className="text-xl font-medium text-surface-200 mb-2">No se encontraron eventos</h3>
      <p className="max-w-md mx-auto">
        {searchTerm
          ? `No hay eventos que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
          : "No hay eventos registrados. Crea el primer evento para comenzar."}
      </p>
      {searchTerm && onClearSearch && (
        <Button variant="outline" className="mt-4 border-primary-500 text-primary-500" onClick={onClearSearch}>
          Limpiar búsqueda
        </Button>
      )}
    </div>
  )
}

