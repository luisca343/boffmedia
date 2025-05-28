"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useBoffSession } from "@/services/useBoffSession";
import { useGalleryData } from "./_hooks/useGalleryData";
import { PlayerGallery } from "../_components/PlayerGallery";

export default function UserGallery() {
  const { session, status } = useBoffSession();
  const router = useRouter();

  const { allCards, userCards, loading, error, updateUserCards } = useGalleryData(session?.user?.name || "");

  // Only handle loading and authentication states
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <h1 className="text-3xl font-bold text-orange-300 mb-4">Cargando...</h1>
        <p className="text-main-300 mb-6 text-center">
          Estamos cargando tu galería de cartas. Por favor, espera un momento.
        </p>
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <h1 className="text-3xl font-bold text-orange-300 mb-4">
          Usuario no encontrado
        </h1>
        <p className="text-main-300 mb-6 text-center">
          Lo sentimos, no pudimos encontrar tus datos.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Volver al Inicio
        </Button>
      </div>
    );
  }

  // Let the error boundary handle errors thrown by useGalleryData
  if (error) {
    throw new Error(error);
  }

  return <PlayerGallery username={session.user.name!} />;
}