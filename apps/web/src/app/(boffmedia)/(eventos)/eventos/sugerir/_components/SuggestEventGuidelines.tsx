"use client"

import { Star, Trophy, Users, Clock, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/primitives/card"

export function SuggestEventGuidelines() {
  const guidelines = [
    {
      icon: Trophy,
      title: "Sé específico",
      description: "Incluye detalles sobre mecánicas, objetivos y qué hace único a tu evento.",
      color: "from-accent-500 to-accent-600"
    },
    {
      icon: Users,
      title: "Piensa en la comunidad",
      description: "¿Cómo puede participar la comunidad? ¿Es inclusivo para todos los niveles?",
      color: "from-secondary-500 to-secondary-600"
    },
    {
      icon: Clock,
      title: "Considera la duración",
      description: "¿Cuánto tiempo debería durar? ¿Es un evento de una vez o recurrente?",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Sparkles,
      title: "Sé creativo",
      description: "Las mejores ideas suelen venir de combinaciones inesperadas o mecánicas innovadoras.",
      color: "from-emerald-500 to-emerald-600"
    }
  ]

  return (
    <div className="mt-12">
      <Card className="bg-surface-800 backdrop-blur-sm border border-surface-600/30">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-400" />
            Consejos para una buena sugerencia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guidelines.map((guideline, index) => {
              const Icon = guideline.icon
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${guideline.color} rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{guideline.title}</h4>
                    <p className="text-surface-300 text-sm">{guideline.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}