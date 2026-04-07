"use client";

import Link from "next/link";
import { Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { FloatingBackground } from "@/app/(boffmedia)/_components/layout/FloatingBackground";

interface ConstructionProps {
  title?: string;
  message?: string;
  showReload?: boolean;
  showHome?: boolean;
  discordUrl?: string;
}

export default function Construction({
  title = "Página en construcción",
  message = "Estamos trabajando en esta sección. ¡Vuelve pronto para ver las novedades!",
  showReload = true,
  showHome = true,
  discordUrl = "https://discord.com/invite/R7MEDDSM5C",
}: ConstructionProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 overflow-hidden flex items-center justify-center">
      <FloatingBackground variant="warm" />

      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="p-5 rounded-full bg-gradient-to-r from-primary-500 to-orange-400 inline-block mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400 mb-2">
              {title}
            </h1>
            <p className="text-surface-300">{message}</p>
          </div>

          <div className="mb-6 p-4 bg-surface-800/20 rounded-lg border border-surface-700/40">
            <p className="text-sm text-surface-200 font-mono break-words">
              Si necesitas acceso o información, visita nuestra{' '}
              <Link href={discordUrl} className="underline text-primary-400">
                comunidad en Discord
              </Link>
              .
            </p>
          </div>

          <div className="flex gap-3 justify-center mb-6">
            {showHome && (
              <Button variant="outline" className="border-surface-600" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Volver al Inicio
                </Link>
              </Button>
            )}

            {showReload && (
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600"
              >
                Recargar
              </Button>
            )}
          </div>

          <p className="text-xs text-surface-400">Gracias por tu paciencia — El equipo de BoffMedia</p>
        </div>
      </div>
    </div>
  );
}
