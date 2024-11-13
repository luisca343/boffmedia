"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout"
import { boffGET, boffPOST } from "@/services/boffAPI"
import { Button } from "@/components/ui/button"
import { useBoffSession } from "@/services/useBoffSession"
import { PlayerGallery } from "../../_components/PlayerGallery"

interface Card {
  expansion: string
  number: number
  name: string
  count: number
}

export default function UserGallery({ params }: { params: { username: string } }) {
  const { session } = useBoffSession()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [userCards, setUserCards] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session, params.username])

  const fetchData = async () => {
    try {
      const [allCardsData, userCardsData] = await Promise.all([
        boffGET('/herramientas/ptcgp/cards'),
        boffPOST('/herramientas/ptcgp/user-cards', { username: params.username }),
      ])
      setAllCards(allCardsData)
      const userCardsMap: Record<string, number> = userCardsData.reduce((acc: Record<string, number>, card: any) => {
        acc[`${card.expansion}_${card.cardNumber}`] = card.count
        return acc
      }, {})
      setUserCards(userCardsMap)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('No se pudieron cargar los datos. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (error || !session?.user) {
    return (
      <BoffLayout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
          <h1 className="text-3xl font-bold text-orange-300 mb-4">Usuario no encontrado</h1>
          <p className="text-gray-300 mb-6 text-center">
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