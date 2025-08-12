import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Award } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"

interface AchievementHeaderProps {
  totalAchievements: number
  searchTerm: string
  onSearchChange: (term: string) => void
  onCreateNew: () => void
  selectedEventId: number | null
  onEventChange: (eventId: number | null) => void
}

export function AchievementHeader({
  totalAchievements,
  searchTerm,
  onSearchChange,
  onCreateNew,
  selectedEventId,
  onEventChange,
}: AchievementHeaderProps) {
  const { events } = useGetEvents()

  return (
    <CardHeader className="pb-4">
      <div className="flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl text-surface-50 flex items-center">
            <Award className="mr-2 h-6 w-6 text-primary-500" />
            Gestión de Logros
          </CardTitle>
          <CardDescription className="text-surface-300">
            Administra los logros y recompensas del sistema
          </CardDescription>
        </div>

        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Logro
        </Button>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder="Buscar logros..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-surface-700 border-surface-600 text-surface-50"
          />
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={selectedEventId?.toString() || "-1"}
            onValueChange={(value) => onEventChange(value === "-1" ? null : Number(value))}
          >
            <SelectTrigger className="w-[200px] bg-surface-700 border-surface-600 text-surface-50">
              <SelectValue placeholder="Filtrar por evento" />
            </SelectTrigger>
            <SelectContent className="bg-surface-800 border-surface-700">
              <SelectItem value="-1">Todos los eventos</SelectItem>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center text-surface-300">
            <span className="mr-2">Total:</span>
            <Badge className="bg-primary-500/20 text-primary-400 border-primary-500/30">{totalAchievements}</Badge>
          </div>
        </div>
      </div>
    </CardHeader>
  )
}

