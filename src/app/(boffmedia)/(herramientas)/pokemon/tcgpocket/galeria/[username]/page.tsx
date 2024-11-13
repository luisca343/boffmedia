"use client"

import { useRouter } from "next/navigation"
import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout"
import { Button } from "@/components/ui/button"
import { useBoffSession } from "@/services/useBoffSession"
import { useGalleryData } from "../_hooks/useGalleryData"
import { PlayerGallery } from "../../_components/PlayerGallery"

export default function UserGallery({ params }: { params: { username: string } }) {
  const router = useRouter()
  const { allCards, userCards, loading, error } = useGalleryData(params.username)


  if(loading) {
    return (
      <BoffLayout>
        <div className="flex flex-col items-center justify-center min-h-full">
          <h1 className="text-3xl font-bold text-orange-300 mb-4">Cargando...</h1>
          <p className="text-main-300 mb-6 text-center">Estamos cargando la galería de cartas de {params.username}. Por favor, espera un momento.</p>
        </div>
      </BoffLayout>
    )
  }

  if (error) {
    return (
      <BoffLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold text-orange-300 mb-4">Usuario no encontrado</h1>
          <p className="text-main-300 mb-6 text-center">
            Lo sentimos, no pudimos encontrar el usuario {params.username} o ocurrió un error al cargar la galería.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-200"
          >
            Volver al Inicio
          </Button>
        </div>
      </BoffLayout>
    )
  }

  return (
    <BoffLayout>
      <PlayerGallery
        username={params.username}
        allCards={allCards}
        userCards={userCards}
        loading={loading}
        editable={false}
      />
    </BoffLayout>
  )
}