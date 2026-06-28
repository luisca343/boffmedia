import React from "react";
import { AlertTriangle, RefreshCw, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { InternalLink } from "@/components/ui/navigation/Link";

interface SectionErrorProps {
  error: string;
  onRetry: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  className?: string;
}

export function SectionError({ 
  error, 
  onRetry, 
  title = "¡Algo salió mal!",
  description = "Hubo un problema al cargar el contenido",
  showHomeButton = true,
  className = ""
}: SectionErrorProps) {
  return (
    <div className={`min-h-screen ${className}`}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-20 text-center relative">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-40 h-40 bg-danger/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-warning/5 rounded-full blur-2xl"></div>
          </div>

          {/* Error Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-danger/20 to-warning/20 rounded-2xl flex items-center justify-center border border-danger-border/20">
              <AlertTriangle className="h-12 w-12 text-danger-hover" />
            </div>
            
            {/* Animated ping effect */}
            <div className="absolute inset-0 w-24 h-24 border-2 border-danger-border/20 rounded-2xl animate-ping"></div>
          </div>

          {/* Error Content */}
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-danger-hover to-warning-hover mb-4">
            {title}
          </h2>
          
          <p className="text-ink mb-2 text-lg">{description}</p>
          
          {/* Error Details */}
          <div className="bg-layer-2/40 backdrop-blur-sm border border-danger-border/20 rounded-xl p-4 mb-8 max-w-md">
            <p className="text-sm text-ink-muted font-mono break-words">{error}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onRetry}
              className="bg-gradient-to-r from-danger to-warning hover:from-danger hover:to-warning font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            
            {showHomeButton && (
              <InternalLink href="/">
                <Button
                  variant="outline"
                  className="border-edge text-ink hover:bg-layer-3 hover:text-ink font-medium"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al inicio
                </Button>
              </InternalLink>
            )}
          </div>

          {/* Help text */}
          <p className="text-ink-muted text-sm mt-8 max-w-md">
            Si el problema persiste, puedes contactar con nuestro equipo de soporte o intentar más tarde.
          </p>
        </div>
      </div>
    </div>
  );
}
