"use client"

import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SubmitButtonProps {
  onSubmit: () => void
  isSubmitting: boolean
  isDisabled: boolean
}

export function SubmitButton({ onSubmit, isSubmitting, isDisabled }: SubmitButtonProps) {
  return (
    <div className="pt-6">
      <Button 
        onClick={onSubmit}
        disabled={isSubmitting || isDisabled}
        className="w-full bg-gradient-to-r from-accent-600 to-secondary-600 hover:from-accent-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg font-semibold"
      >
        {isSubmitting ? (
          <>
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
            Enviando Sugerencia...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-3" />
            Enviar Sugerencia
          </>
        )}
      </Button>
    </div>
  )
}