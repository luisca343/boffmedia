"use client"

import { ArrowLeft, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SuggestEventHeader() {
  return (
    <>
      {/* Navigation */}
      <div className="mb-8">
        <Button variant="ghost" className="text-surface-300 hover:text-surface-50 hover:bg-surface-800/50 border border-transparent hover:border-accent-500/30">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a eventos
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block relative">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400 mb-4">
            Sugerir Evento
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-accent-500 to-secondary-400 mx-auto rounded-full"></div>
          
          {/* Floating icons around title */}
          <div className="absolute -top-6 -left-12 w-8 h-8 bg-gradient-to-br from-accent-500 to-secondary-600 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -top-6 -right-12 w-8 h-8 bg-gradient-to-br from-secondary-500 to-accent-600 rounded-full flex items-center justify-center animate-bounce" style={{animationDelay: '0.5s'}}>
            <Star className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-xl text-surface-300 mt-6 max-w-3xl mx-auto">
          ¿Tienes una idea increíble para un evento? ¡Compártela con nosotros y podríamos hacerla realidad!
        </p>
      </div>
    </>
  )
}