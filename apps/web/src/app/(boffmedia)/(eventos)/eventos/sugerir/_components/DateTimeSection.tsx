"use client"

import { Clock, Calendar, Users } from "lucide-react"
import { EventFormData } from "../page"

interface DateTimeSectionProps {
  suggestedDate: string
  endDate: string
  maxParticipants: string
  onInputChange: (field: keyof EventFormData, value: string) => void
}

export function DateTimeSection({ 
  suggestedDate, 
  endDate, 
  maxParticipants, 
  onInputChange 
}: DateTimeSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-3">
        <label className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary-hover" />
          Fecha Sugerida
        </label>
        <input
          type="datetime-local"
          value={suggestedDate}
          onChange={(e) => onInputChange('suggestedDate', e.target.value)}
          className="w-full p-4 bg-layer-3/50 border border-edge/50 rounded-xl text-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
        />
      </div>

      <div className="space-y-3">
        <label className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary-hover" />
          Fecha Final (Opcional)
        </label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => onInputChange('endDate', e.target.value)}
          className="w-full p-4 bg-layer-3/50 border border-edge/50 rounded-xl text-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
        />
      </div>

      <div className="space-y-3">
        <label className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary-hover" />
          Máx. Participantes
        </label>
        <input
          type="number"
          value={maxParticipants}
          onChange={(e) => onInputChange('maxParticipants', e.target.value)}
          placeholder="100"
          min="1"
          className="w-full p-4 bg-layer-3/50 border border-edge/50 rounded-xl text-white placeholder-ink-dim focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
        />
      </div>
    </div>
  )
}