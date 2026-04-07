"use client"

import { Card, CardContent } from "@/components/ui/primitives/card"
import { EventTypeSelector } from "./EventTypeSelector"
import { BasicInfoSection } from "./BasicInfoSection"
import { DateTimeSection } from "./DateTimeSection"
import { EventPreview } from "./EventPreview"
import { SubmitButton } from "./SubmitButton"
import { EventFormData } from "../page"

interface SuggestEventFormProps {
  formData: EventFormData
  onInputChange: (field: keyof EventFormData, value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function SuggestEventForm({ formData, onInputChange, onSubmit, isSubmitting }: SuggestEventFormProps) {
  return (
    <Card className="bg-gradient-to-r from-surface-800/80 via-accent-900/20 to-surface-800/80 backdrop-blur-sm border border-accent-500/20">
      <CardContent className="p-8">
        <div className="space-y-8">
          <EventTypeSelector 
            selectedType={formData.type}
            onTypeChange={(type) => onInputChange('type', type)}
          />

          <BasicInfoSection
            title={formData.title}
            gameName={formData.gameName}
            description={formData.description}
            additionalInfo={formData.additionalInfo}
            onInputChange={onInputChange}
          />

          <DateTimeSection
            suggestedDate={formData.suggestedDate}
            endDate={formData.endDate}
            maxParticipants={formData.maxParticipants}
            onInputChange={onInputChange}
          />

          <EventPreview formData={formData} />

          <SubmitButton
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            isDisabled={!formData.title || !formData.description || !formData.type}
          />
        </div>
      </CardContent>
    </Card>
  )
}