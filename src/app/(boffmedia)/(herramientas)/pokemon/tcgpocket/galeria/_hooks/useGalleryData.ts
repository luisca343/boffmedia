import { useState, useEffect } from 'react'
import { PtcgpService } from '@/services/api/boffmedia/ptcgpService'
import { toast } from 'react-toastify'
import { TcgCard, UserCardEntity } from '@/generated/api'

interface Card {
  expansion: string
  number: number
  name: string
  count: number
}

export function useGalleryData(username: string) {
  const [allCards, setAllCards] = useState<TcgCard[]>([])
  const [userCards, setUserCards] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if(!username) return
    fetchData()
  }, [username])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [allCardsResponse, userCardsResponse] = await Promise.all([
        PtcgpService.getAllCardsForSeries('tcgp'),
        PtcgpService.getUserCards(username),
      ])

      const allCardsData = allCardsResponse.data
      const userCardsData = userCardsResponse.data

      if(!allCardsData || !userCardsData) return  
      
      setAllCards(allCardsData)
      const userCardsMap: Record<string, number> = userCardsData.reduce((acc: Record<string, number>, card: any) => {
        acc[card.cardId] = card.quantity
        return acc
      }, {})
      setUserCards(userCardsMap)
      setError(null)
    } catch (error) {
      setError('No se pudieron cargar los datos. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const updateUserCards = async (updates: { cardId: string; change: number }[]) => {
    setLoading(true)
    try {
      // Convert updates to the format expected by the service
      const cardUpdates = updates.map(update => ({
        userId: username,
        cardId: update.cardId,
        quantity: Math.max(0, (userCards[update.cardId] || 0) + update.change)
      }))

      // Use individual update calls since batchUpdateUserCards doesn't exist
      await Promise.all(cardUpdates.map(async (update) => {
        if (update.quantity === 0) {
          await PtcgpService.removeUserCard(update.userId, update.cardId)
        } else {
          const existingCard = userCards[update.cardId]
          if (existingCard) {
            await PtcgpService.updateUserCardQuantity(update.userId, update.cardId, { quantity: update.quantity })
          } else {
            await PtcgpService.addUserCard({ userId: update.userId, cardId: update.cardId, quantity: update.quantity })
          }
        }
      }))

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