"use client"

import { Trophy, Server } from "lucide-react"

interface EventTypeSelectorProps {
  selectedType: string
  onTypeChange: (type: string) => void
}

export function EventTypeSelector({ selectedType, onTypeChange }: EventTypeSelectorProps) {
  const eventTypes = [
    { 
      value: 'EVENT', 
      label: 'Evento Competitivo', 
      icon: Trophy, 
      color: 'from-accent-500 to-accent-600',
      description: 'Competición con medallas y premios'
    },
    { 
      value: 'SERVER', 
      label: 'Servidor Especial', 
      icon: Server, 
      color: 'from-secondary-500 to-secondary-600',
      description: 'Servidor de videojuego con eventos, mecánicas y logros'
    }
  ]

  return (
    <div className="space-y-4">
      <label className="text-lg font-semibold text-white flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent-400" />
        Tipo de Evento
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eventTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.value
          return (
            <div
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              className={`p-0 rounded-xl border-2 cursor-pointer transition-all duration-300 h-32 flex flex-col justify-center ${
                isSelected 
                  ? 'border-accent-500 bg-accent-500/10 scale-105' 
                  : 'border-surface-600/50 hover:border-accent-500/50 hover:bg-accent-500/5'
              }`}
            >
              <div className="flex flex-row items-center gap-4 h-full px-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col justify-center min-h-[64px] h-full py-2">
                  <h3 className="text-white font-semibold leading-tight">{type.label}</h3>
                  <p className="text-surface-400 text-sm min-h-[1.5em] flex items-center">{type.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}