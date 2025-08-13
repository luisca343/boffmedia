import { useState, useEffect } from 'react'
import { PtcgpService } from '@/services/api/boffmedia/ptcgpService'
import { toast } from 'react-toastify'
import { BoffMediaUserEntity, TcgCard } from '@/generated/api'
import { useLocale } from 'next-intl'
import { UsersService } from '@/services/api/boffmedia/usersService'

interface Card {
  expansion: string
  number: number
  name: string
  count: number
}

export function useGalleryData(username: string) {
  const [user, setUser] = useState<BoffMediaUserEntity | null>(null)
  const [allCards, setAllCards] = useState<TcgCard[]>([])
  const [userCards, setUserCards] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocale()

  useEffect(() => {
    if(!username) return
    fetchData()
  }, [username])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [userResponse, allCardsResponse, userCardsResponse] = await Promise.all([
        UsersService.getUserByUsername(username),
        PtcgpService.getAllCardsForSeries('tcgp', locale),
        PtcgpService.getUserCards(username),
      ])

      const userData = userResponse.data
      const allCardsData = allCardsResponse.data
      const userCardsData = userCardsResponse.data

      if(!allCardsData || !userCardsData || !userData) return  
      
      const filteredCards = allCardsData.filter(card => card !== null)
      setAllCards(filteredCards)

      const userCardsMap: Record<string, number> = userCardsData.reduce((acc: Record<string, number>, card: any) => {
        acc[card.card_id] = card.quantity
        return acc
      }, {})


      setUser(userData)
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
        userId: user?.id!,
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