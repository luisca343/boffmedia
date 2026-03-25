"use client"

import { Sparkles, Trophy, Server, Calendar, MapPin, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/primitives/badge"
import { EventFormData } from "../page"

interface EventPreviewProps {
  formData: EventFormData
}

export function EventPreview({ formData }: EventPreviewProps) {
  const eventTypes = [
    { value: 'EVENT', label: 'Evento Competitivo', icon: Trophy, color: 'from-accent-500 to-accent-600' },
    { value: 'SERVER', label: 'Servidor Especial', icon: Server, color: 'from-secondary-500 to-secondary-600' }
  ]

  const selectedType = eventTypes.find(t => t.value === formData.type)

  if (!formData.title || !formData.description) {
    return null
  }

  return (
    <div className="space-y-3">
      <label className="text-lg font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent-400" />
        Vista Previa
      </label>
      <div className="bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${
            selectedType?.color || 'from-surface-500 to-surface-600'
          } rounded-xl flex items-center justify-center`}>
            {selectedType ? (
              <selectedType.icon className="w-6 h-6 text-white" />
            ) : (
              <Calendar className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <Badge className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-xs font-bold">
              SUGERENCIA
            </Badge>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">{formData.title}</h3>
        <p className="text-surface-300 mb-4">{formData.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {formData.gameName && (
            <div className="flex items-center gap-2 text-surface-300">
              <MapPin className="w-4 h-4 text-accent-400" />
              <span>{formData.gameName}</span>
            </div>
          )}
          {selectedType && (
            <div className="flex items-center gap-2 text-surface-300">
              <Trophy className="w-4 h-4 text-accent-400" />
              <span>{selectedType.label}</span>
            </div>
          )}
          {formData.suggestedDate && (
            <div className="flex items-center gap-2 text-surface-300">
              <Clock className="w-4 h-4 text-accent-400" />
              <span>{new Date(formData.suggestedDate).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          )}
          {formData.maxParticipants && (
            <div className="flex items-center gap-2 text-surface-300">
              <Users className="w-4 h-4 text-accent-400" />
              <span>{formData.maxParticipants} participantes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}