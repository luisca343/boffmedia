"use client"

import { Trophy, Medal, Award } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"

interface LeaderboardEmptyStateProps {
  title?: string
  description?: string
  searchTerm?: string
  onClearSearch?: () => void
  icon?: 'trophy' | 'medal' | 'award'
  className?: string
}

export function LeaderboardEmptyState({
  title,
  description,
  searchTerm,
  onClearSearch,
  icon = 'trophy',
  className = "",
}: LeaderboardEmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case 'medal': return <Medal className="w-12 h-12 text-surface-400" />
      case 'award': return <Award className="w-12 h-12 text-surface-400" />
      default: return <Trophy className="w-12 h-12 text-surface-400" />
    }
  }

  const getDefaultTitle = () => {
    if (searchTerm) return "No se encontraron jugadores"
    switch (icon) {
      case 'medal': return "No hay medallas ganadas todavía"
      case 'award': return "No hay logros desbloqueados todavía"
      default: return "Clasificación vacía"
    }
  }

  const getDefaultDescription = () => {
    if (searchTerm) {
      return `No hay jugadores que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
    }
    switch (icon) {
      case 'medal': return "Participa en eventos para ganar medallas y puntos."
      case 'award': return "Juega regularmente para desbloquear logros y ganar puntos extra."
      default: return "Los resultados aparecerán cuando comience la competición"
    }
  }

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-24 h-24 bg-surface-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
        {getIcon()}
      </div>
      <h3 className="text-xl font-semibold text-surface-300 mb-2">
        {title || getDefaultTitle()}
      </h3>
      <p className="text-surface-400 max-w-md mx-auto">
        {description || getDefaultDescription()}
      </p>
      {searchTerm && onClearSearch && (
        <Button 
          variant="outline" 
          className="mt-4 border-accent-500/30 text-accent-400 hover:bg-accent-500/20" 
          onClick={onClearSearch}
        >
          Limpiar búsqueda
        </Button>
      )}
    </div>
  )
}
