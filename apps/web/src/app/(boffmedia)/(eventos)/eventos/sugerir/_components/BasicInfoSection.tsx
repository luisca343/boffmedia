"use client"

import { Star, Gamepad2 } from "lucide-react"
import { EventFormData } from "../page"

interface BasicInfoSectionProps {
  title: string
  gameName: string
  description: string
  additionalInfo: string
  onInputChange: (field: keyof EventFormData, value: string) => void
}

export function BasicInfoSection({ 
  title, 
  gameName, 
  description, 
  additionalInfo, 
  onInputChange 
}: BasicInfoSectionProps) {
  return (
    <>
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-400" />
            Nombre del Evento
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Un nombre épico para tu evento..."
            className="w-full p-4 bg-surface-700/50 border border-surface-600/50 rounded-xl text-white placeholder-surface-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
          />
        </div>

        <div className="space-y-3">
          <label className="text-lg font-semibold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-accent-400" />
            Juego
          </label>
          <input
            type="text"
            value={gameName}
            onChange={(e) => onInputChange('gameName', e.target.value)}
            placeholder="¿En qué juego será?"
            className="w-full p-4 bg-surface-700/50 border border-surface-600/50 rounded-xl text-white placeholder-surface-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <label className="text-lg font-semibold text-white">
          Descripción del Evento
        </label>
        <textarea
          value={description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Describe tu evento en detalle. ¿Qué lo hace especial? ¿Qué actividades incluye?"
          rows={4}
          className="w-full p-4 bg-surface-700/50 border border-surface-600/50 rounded-xl text-white placeholder-surface-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all resize-none"
        />
      </div>

      {/* Additional Info */}
      <div className="space-y-3">
        <label className="text-lg font-semibold text-white">
          Información Adicional
        </label>
        <textarea
          value={additionalInfo}
          onChange={(e) => onInputChange('additionalInfo', e.target.value)}
          placeholder="¿Hay algo más que deberíamos saber? Reglas especiales, premios sugeridos, modalidades específicas..."
          rows={3}
          className="w-full p-4 bg-surface-700/50 border border-surface-600/50 rounded-xl text-white placeholder-surface-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all resize-none"
        />
      </div>
    </>
  )
}