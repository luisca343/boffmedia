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
      const userCardsMap: Record<string, number> = userCardsData.reduce((acc: Record<string, number>, card: UserCardEntity) => {
        acc[`${card.expansion}_${card.cardNumber}`] = card.count
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

  const updateUserCards = async (updates: { expansion: string; cardNumber: number; change: number }[]) => {
    setLoading(true)
    try {
      // Convert updates to the format expected by the service
      const cardUpdates = updates.map(update => ({
        cardId: `${update.expansion}_${update.cardNumber}`,
        count: (userCards[`${update.expansion}_${update.cardNumber}`] || 0) + update.change
      }))

      await PtcgpService.batchUpdateUserCards(username, cardUpdates)
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