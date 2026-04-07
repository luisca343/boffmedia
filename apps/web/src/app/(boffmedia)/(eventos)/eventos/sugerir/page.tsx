
"use client"

import { useState } from "react"
import { SectionHeader } from "@/components/boffmedia/sections/SectionHeader"
import { Sparkles, Star } from "lucide-react"
import { SuggestEventForm } from "./_components/SuggestEventForm"
import { SuggestEventSuccess } from "./_components/SuggestEventSuccess"
import { SuggestEventGuidelines } from "./_components/SuggestEventGuidelines"

export interface EventFormData {
  title: string
  description: string
  gameName: string
  type: string
  suggestedDate: string
  endDate: string
  maxParticipants: string
  additionalInfo: string
}

export default function SuggestEventPage() {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    gameName: '',
    type: '',
    suggestedDate: '',
    endDate: '',
    maxParticipants: '',
    additionalInfo: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const resetForm = () => {
    setIsSubmitted(false)
    setFormData({
      title: '',
      description: '',
      gameName: '',
      type: '',
      suggestedDate: '',
      endDate: '',
      maxParticipants: '',
      additionalInfo: ''
    })
  }

  if (isSubmitted) {
    return <SuggestEventSuccess onReset={resetForm} />
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6 max-w-4xl">
        <SectionHeader
          title="Sugerir Evento"
          subtitle="¿Tienes una idea increíble para un evento? ¡Compártela con nosotros y podríamos hacerla realidad!"
          leftIcon={<Sparkles className="w-4 h-4 text-white" />}
          rightIcon={<Star className="w-4 h-4 text-white" />}
        />

        <SuggestEventForm
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <SuggestEventGuidelines />
      </div>
    </div>
  )
}