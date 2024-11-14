"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout"
import { Button } from "@/components/ui/button"
import { useBoffSession } from "@/services/useBoffSession"
import { useGalleryData } from "./_hooks/useGalleryData"
import { PlayerGallery } from "../_components/PlayerGallery"

interface Card {
  expansion: string
  number: number
  name: string
  count: number
}

export default function UserGallery() {
  const { session, status } = useBoffSession()
  const router = useRouter()
  const [changes, setChanges] = useState<Record<string, number>>({})

  const { allCards, userCards, loading, error, updateUserCards } = useGalleryData(session?.user?.username || '')

  const handleAddCard = (card: Card) => {
    const key = `${card.expansion}_${card.number}`
    setChanges(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
  }

  const handleRemoveCard = (card: Card) => {
    const key = `${card.expansion}_${card.number}`
    const currentCount = userCards[key] || 0
    const changeCount = changes[key] || 0
    if (currentCount + changeCount > 0) {
      setChanges(prev => ({ ...prev, [key]: (prev[key] || 0) - 1 }))
    }
  }

  const saveChanges = async () => {
    const updates = Object.entries(changes).map(([key, change]) => {
      const [expansion, cardNumber] = key.split('_')
      return {
        expansion,
        cardNumber: parseInt(cardNumber),
        change,
      }
    })

    await updateUserCards(updates)
    setChanges({})
  }

  if (status === 'loading') {
    return (
      <BoffLayout>
        <div className="flex flex-col items-center justify-center min-h-full">
          <h1 className="text-3xl font-bold text-primary mb-4">Cargando...</h1>
          <p className="text-text-secondary mb-6 text-center">Estamos cargando tu galería de cartas. Por favor, espera un momento.</p>
        </div>
      </BoffLayout>
    )
  }

  if (!session || !session.user) {
    return (
      <BoffLayout>
        <div className="flex flex-col items-center justify-center min-h-full">
          <h1 className="text-3xl font-bold text-primary mb-4">Usuario no encontrado</h1>
          <p className="text-text-secondary mb-6 text-center">
            Lo sentimos, no pudimos encontrar tus datos o ocurrió un error al cargar la galería.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-primary-light hover:bg-primary-hover text-white transition-colors duration-200"
          >
            Volver al Inicio
          </Button>
        </div>
      </BoffLayout>
    )
  }

  if (error) {
    return (
      <BoffLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold text-primary mb-4">Error</h1>
          <p className="text-text-secondary mb-6 text-center">{error}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-primary-light hover:bg-primary-hover text-white transition-colors duration-200"
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
        username={session.user.username}
        allCards={allCards}
        userCards={userCards}
        loading={loading}
        editable={true}
        onAddCard={handleAddCard}
        onRemoveCard={handleRemoveCard}
        onSaveChanges={saveChanges}
      />
    </BoffLayout>
  )
}