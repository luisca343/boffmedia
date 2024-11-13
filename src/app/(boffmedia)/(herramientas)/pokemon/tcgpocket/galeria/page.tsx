"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout"
import { boffGET, boffPOST } from "@/services/boffAPI"
import { Button } from "@/components/ui/button"
import { useBoffSession } from "@/services/useBoffSession"
import { toast } from 'react-toastify'
import { PlayerGallery } from "../_components/PlayerGallery"

interface Card {
  expansion: string
  number: number
  name: string
  count: number
}

export default function UserGallery() {
  const { session } = useBoffSession()
  const router = useRouter()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [userCards, setUserCards] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [changes, setChanges] = useState<Record<string, number>>({})

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      const [allCardsData, userCardsData] = await Promise.all([
        boffGET('/herramientas/ptcgp/cards'),
        boffPOST('/herramientas/ptcgp/user-cards', { username: session.user.username }),
      ])
      setAllCards(allCardsData)
      const userCardsMap: Record<string, number> = userCardsData.reduce((acc: Record<string, number>, card: any) => {
        acc[`${card.expansion}_${card.cardNumber}`] = card.count
        return acc
      }, {})
      setUserCards(userCardsMap)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('No se pudieron cargar los datos. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

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
    setLoading(true)
    try {
      const updates = Object.entries(changes).map(([key, change]) => {
        const [expansion, cardNumber] = key.split('_')
        return {
          expansion,
          cardNumber: parseInt(cardNumber),
          change,
        }
      })

      await boffPOST('/herramientas/ptcgp/update-cards', {
        username: session.user.username,
        updates,
      })

      setChanges({})
      await fetchData()
      toast.success('Cambios guardados exitosamente.')
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('No se pudieron guardar los cambios. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!session || !session.user) {
    return (
      <BoffLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold text-orange-300 mb-4">Usuario no encontrado</h1>
          <p className="text-gray-300 mb-6 text-center">
            Lo sentimos, no pudimos encontrar tus datos o ocurrió un error al cargar la galería.
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