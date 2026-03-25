import { Card, CardContent } from "@/components/ui/primitives/card"
import { Button } from "@/components/ui/primitives/button"
import { RefreshCw } from "lucide-react"

interface TeamErrorStateProps {
  error: string
  onRetry: () => void
}

export function TeamErrorState({ error, onRetry }: TeamErrorStateProps) {
  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <div className="text-warning-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-surface-50">Error al cargar equipos</h2>
          <p className="text-surface-300 mb-6">{error}</p>
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

