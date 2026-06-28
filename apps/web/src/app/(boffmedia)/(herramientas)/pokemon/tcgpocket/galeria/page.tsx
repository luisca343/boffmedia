"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiExclamationTriangle, HiUserCircle } from 'react-icons/hi2';
import { Button } from "@/components/ui/primitives/button";
import { useBoffSession } from "@/services/useBoffSession";
import { PlayerGallery } from "../_components/PlayerGallery";
import { Loader2 } from "lucide-react";

export default function UserGallery() {
  const { session, status } = useBoffSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-4 rounded-full bg-layer-3/50 border border-edge/50">
          <Loader2 className="w-8 h-8 text-primary-hover animate-spin" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-ink mb-2">Cargando...</h1>
          <p className="text-ink-muted">
            Estamos cargando tu galería de cartas. Por favor, espera un momento.
          </p>
        </div>
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
          <HiExclamationTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-ink mb-2">
            Usuario no encontrado
          </h1>
          <p className="text-ink-muted mb-6">
            Lo sentimos, no pudimos encontrar tus datos.
          </p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
          >
            <HiUserCircle className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }
  
  return <PlayerGallery username={session.user.name!} />;
}