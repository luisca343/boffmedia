import { useState, useEffect } from 'react'
import { boffGET, boffPOST } from "@/services/boffAPI"
import { toast } from 'react-toastify'

interface Card {
  expansion: string
  number: number
  name: string
  count: number
}

export function useGalleryData(username: string) {
  const [allCards, setAllCards] = useState<Card[]>([])
  const [userCards, setUserCards] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if(!username) return
    fetchData()
  }, [username])

  const fetchData = async () => {
    try {
      const [allCardsData, userCardsData] = await Promise.all([
        (await boffGET('/herramientas/ptcgp/cards')).data as Card[],
        (await boffPOST('/herramientas/ptcgp/user-cards', { username })).data as Card[],
      ])
      setAllCards(allCardsData)
      const userCardsMap: Record<string, number> = userCardsData.reduce((acc: Record<string, number>, card: any) => {
        acc[`${card.expansion}_${card.cardNumber}`] = card.count
        return acc
      }, {})
      setUserCards(userCardsMap)
      setError(null)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('No se pudieron cargar los datos. Por favor, intenta de nuevo.')
      toast.error('No se pudieron cargar los datos. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const updateUserCards = async (updates: { expansion: string; cardNumber: number; change: number }[]) => {
    setLoading(true)
    try {
      await boffPOST('/herramientas/ptcgp/update-cards', {
        username,
        updates,
      })
      await fetchData()
      toast.success('Cambios guardados exitosamente.')
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('No se pudieron guardar los cambios. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return { allCards, userCards, loading, error, updateUserCards }
}