import { CardHeader, CardTitle, CardDescription } from "@/components/ui/primitives/card"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Badge } from "@/components/ui/primitives/badge"
import { Plus, Search, Calendar } from "lucide-react"

interface EventHeaderProps {
  totalEvents: number
  searchTerm: string
  onSearchChange: (term: string) => void
  onCreateNew: () => void
}

export function EventHeader({ totalEvents, searchTerm, onSearchChange, onCreateNew }: EventHeaderProps) {
  return (
    <CardHeader className="pb-4">
      <div className="flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl text-surface-50 flex items-center">
            <Calendar className="mr-2 h-6 w-6 text-primary-500" />
            Gestión de Eventos
          </CardTitle>
          <CardDescription className="text-surface-300">Administra los eventos y competiciones</CardDescription>
        </div>

        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-surface-700 border-surface-600 text-surface-50"
          />
        </div>

        <div className="flex items-center text-surface-300">
          <span className="mr-2">Total:</span>
          <Badge className="bg-primary-500/20 text-primary-400 border border-primary-500/30">{totalEvents}</Badge>
        </div>
      </div>
    </CardHeader>
  )
}

