"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { FloatingBackground } from "./_components/layout/FloatingBackground";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 overflow-hidden flex items-center justify-center">
      <FloatingBackground variant="warm" />
      
      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-md mx-auto text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-error-500 to-warning-500 inline-block mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-error-400 to-warning-400 mb-2">
              ¡Algo salió mal!
            </h1>
            <p className="text-surface-300">
              Ha ocurrido un error inesperado.
            </p>
          </div>

          {/* Error Details */}
          <div className="mb-6 p-4 bg-surface-800/30 rounded-lg border border-surface-700/50 backdrop-blur-sm text-left">
            <div className="mb-3">
              <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                Mensaje de error:
              </span>
              <p className="mt-1 text-sm text-surface-100 font-mono leading-relaxed break-words">
                {error.message || "Error desconocido"}
              </p>
            </div>
            
            {error.digest && (
              <div>
                <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                  ID de seguimiento:
                </span>
                <p className="mt-1 text-xs text-surface-200 font-mono">
                  {error.digest}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center mb-6">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>

            <Button variant="outline" className="border-surface-600" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Inicio
              </Link>
            </Button>
          </div>

          {/* Support Link */}
          <p className="text-xs text-surface-400">
            ¿Necesitas ayuda?{" "}
            <Link 
              href="https://discord.com/invite/R7MEDDSM5C" 
              className="text-primary-400 hover:text-primary-300 underline"
            >
              Comunidad Discord
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}