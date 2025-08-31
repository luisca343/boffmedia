import { Card, CardContent } from "@/components/ui/primitives/card"

export function EventLoadingState() {
  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="ml-4 text-surface-300">Cargando eventos...</p>
        </div>
      </CardContent>
    </Card>
  )
}

