import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";

interface EventsErrorProps {
  error: string;
  onRetry: () => void;
}

export function EventsError({ error, onRetry }: EventsErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-20 text-center relative">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-40 h-40 bg-error-500/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-warning-500/5 rounded-full blur-2xl"></div>
          </div>

          {/* Error Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-error-600/20 to-warning-600/20 rounded-2xl flex items-center justify-center border border-error-500/20">
              <AlertTriangle className="h-12 w-12 text-error-400" />
            </div>
            
            {/* Pulsing ring */}
            <div className="absolute inset-0 w-24 h-24 border-2 border-error-500/20 rounded-2xl animate-ping"></div>
          </div>

          {/* Error Content */}
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-error-400 to-warning-400 mb-4">
            ¡Algo salió mal!
          </h2>
          
          <p className="text-surface-300 mb-2 text-lg">Error al cargar los eventos</p>
          
          {/* Error Details */}
          <div className="bg-surface-800/40 backdrop-blur-sm border border-error-500/20 rounded-xl p-4 mb-8 max-w-md">
            <p className="text-sm text-surface-400 font-mono break-words">{error}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={onRetry} 
              className="bg-gradient-to-r from-error-600 to-warning-600 hover:from-error-700 hover:to-warning-700 px-8"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            
            <Button 
              variant="outline" 
              className="border-surface-600 text-surface-300 hover:bg-surface-700 px-8"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-surface-500 text-sm mt-8 max-w-md">
            Si el problema persiste, puedes contactar con nuestro equipo de soporte o intentar más tarde.
          </p>
        </div>
      </div>
    </div>
  );
}