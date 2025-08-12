"use client"

import { CheckCircle, Star, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuggestEventSuccessProps {
  onReset: () => void
}

export function SuggestEventSuccess({ onReset }: SuggestEventSuccessProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-success-500/20 to-emerald-500/20 rounded-full blur-xl"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-success-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-success-400 to-emerald-400 mb-4 text-center">
            ¡Sugerencia Enviada!
          </h1>
          <p className="text-xl text-surface-300 text-center max-w-2xl mb-8">
            Gracias por tu propuesta. Nuestro equipo la revisará y te notificaremos si decidimos implementarla.
          </p>
          
          <div className="flex gap-4">
            <Button 
              onClick={onReset}
              variant="accent"
            >
              <Star className="w-4 h-4 mr-2" />
              Sugerir Otro Evento
            </Button>
            <Button variant="outline" className="border-accent-500/30 text-accent-400 hover:bg-accent-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}