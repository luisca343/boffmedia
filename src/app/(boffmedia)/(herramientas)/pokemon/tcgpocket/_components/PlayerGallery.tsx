'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from 'lucide-react'
import { useTranslations } from "next-intl"
import { toast } from 'react-toastify'
import { boffPOST, boffGET } from "@/services/boffAPI"
import { usePathname } from "next/navigation"
import { useGalleryData } from "../galeria/_hooks/useGalleryData"
import { PlayerGalleryHeader } from "./PlayerGalleryHeader"
import { RecentUpdates } from "./RecentUpdates"
import { BestPackDialog } from "./BestPackDialog"
import { Card, PackProbabilities, RecentUpdate, PackData, AllPackProbabilities } from '../types'
import { FilterComponent } from "./FilterComponent"
import { CollectionGroup } from "./CollectionGroup"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PlayerGalleryProps {
  username: string
}

export function PlayerGallery({ username }: PlayerGalleryProps) {
  const { allCards, userCards, loading, error, updateUserCards } = useGalleryData(username || '')

  const [hideMissingCards, setHideMissingCards] = useState(false)
  const [changes, setChanges] = useState<Record<string, number>>({})
  const [cardCount, setCardCount] = useState(0)
  const [bestPackLoading, setBestPackLoading] = useState(false)
  const [bestPackData, setBestPackData] = useState<{ bestPack: PackData, allPackProbabilities: AllPackProbabilities } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string>("general")
  const [eventPackData, setEventPackData] = useState<{ bestPack: PackData, allPackProbabilities: AllPackProbabilities, missingEventCards: string[], totalEventCards: number } | null>(null)
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([])
  const [recentUpdatesLoading, setRecentUpdatesLoading] = useState(false)
  const [recentUpdatesOffset, setRecentUpdatesOffset] = useState(0)
  const [recentUpdatesError, setRecentUpdatesError] = useState<string | null>(null)
  const [showAmounts, setShowAmounts] = useState(true)
  const [isRecentUpdatesOpen, setIsRecentUpdatesOpen] = useState(false)
  const trans = useTranslations('tcgpocket')
  const [nameFilter, setNameFilter] = useState("")
  const [expansionFilter, setExpansionFilter] = useState("")

  const pathname = usePathname();
  const editable = pathname === '/pokemon/tcgpocket/galeria';

  useEffect(() => {
    const count = Object.values(userCards).reduce((acc, curr) => acc + curr, 0)
    setCardCount(count)
  }, [userCards])

  useEffect(() => {
    fetchRecentUpdates()
  }, [username])

  const fetchRecentUpdates = async () => {
    if (recentUpdatesLoading) return
    setRecentUpdatesLoading(true)
    setRecentUpdatesError(null)
    try {
      const response = await boffGET(`/herramientas/ptcgp/recent-updates?username=${username}&limit=10&offset=${recentUpdatesOffset}`)
      const updates = Array.isArray(response) ? response : []
      if (updates.length > 0) {
        setRecentUpdates(prevUpdates => [...prevUpdates, ...updates])
        setRecentUpdatesOffset(prevOffset => prevOffset + updates.length)
      } else {
        toast.info('No more updates to load')
      }
    } catch (error) {
      console.error('Error fetching recent updates:', error)
      setRecentUpdatesError('Failed to fetch recent updates. Please try again later.')
      toast.error('Failed to fetch recent updates')
    } finally {
      setRecentUpdatesLoading(false)
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
    const updates = Object.entries(changes).map(([key, change]) => {
      const [expansion, cardNumber] = key.split('_')
      return {
        expansion,
        cardNumber: parseInt(cardNumber),
        change,
      }
    })

    await updateUserCards(updates)
    const newUpdates = updates.map(update => ({
      id: Date.now(),
      expansion: update.expansion,
      cardNumber: update.cardNumber,
      count: update.change,
      updatedAt: new Date().toISOString(),
      cardName: allCards.find(card => card.expansion === update.expansion && card.number === update.cardNumber)?.name || 'Unknown Card'
    }));

    setRecentUpdates(prevUpdates => [...newUpdates, ...prevUpdates]);
    setChanges({})
  }

  const getBestPack = async () => {
    setBestPackLoading(true)
    try {
      if (selectedEvent === "general") {
        const result = await boffPOST('/herramientas/ptcgp/best-pack', { username })
        if (result.message) {
          toast.info(result.message)
        } else {
          setBestPackData(result)
          setEventPackData(null)
          setIsDialogOpen(true)
        }
      } else {
        const result = await boffPOST('/herramientas/ptcgp/best-pack-for-event', { username, eventName: selectedEvent })
        if (result.message) {
          toast.info(result.message)
        } else {
          setEventPackData(result)
          setBestPackData(null)
          setIsDialogOpen(true)
        }
      }
    } catch (error) {
      console.error('Error getting best pack:', error)
      toast.error('No se pudo obtener el mejor pack. Por favor, intenta de nuevo.')
    } finally {
      setBestPackLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <PlayerGalleryHeader
          username={username}
          cardCount={cardCount}
          editable={editable}
          hideMissingCards={hideMissingCards}
          setHideMissingCards={setHideMissingCards}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          getBestPack={getBestPack}
          bestPackLoading={bestPackLoading}
          showAmounts={showAmounts}
          setShowAmounts={setShowAmounts}
          onRecentUpdatesClick={() => setIsRecentUpdatesOpen(true)}
        />
        <div className="mt-8">
          <FilterComponent
            expansions={Array.from(new Set(allCards.map(card => card.expansion)))}
            onFilterChange={(name, expansion) => {
              setNameFilter(name)
              setExpansionFilter(expansion)
            }}
            trans={trans}
          />
        </div>
        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : allCards.length === 0 ? (
            <p className="text-center text-surface-300">No se encontraron cartas.</p>
          ) : (
            <div>
              {Object.entries(
                allCards
                  .filter(card =>
                    (card.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                      card.number.toString().includes(nameFilter)) &&
                    (expansionFilter === "" || card.expansion === expansionFilter)
                  )
                  .reduce<Record<string, Card[]>>((acc, curr) => {
                    if (!acc[curr.expansion]) {
                      acc[curr.expansion] = []
                    }
                    acc[curr.expansion].push(curr)
                    return acc
                  }, {})
              ).map(([expansion, cards]) => (
                <CollectionGroup
                  key={expansion}
                  expansion={expansion}
                  cards={cards}
                  userCards={userCards}
                  changes={changes}
                  hideMissingCards={hideMissingCards}
                  editable={editable}
                  loading={loading}
                  handleAddCard={handleAddCard}
                  handleRemoveCard={handleRemoveCard}
                  trans={trans}
                  showAmounts={showAmounts}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {editable && Object.keys(changes).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Button onClick={saveChanges} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </motion.div>
      )}
      <BestPackDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedEvent={selectedEvent}
        bestPackData={bestPackData}
        eventPackData={eventPackData}
      />
      <Dialog open={isRecentUpdatesOpen} onOpenChange={setIsRecentUpdatesOpen}>
        <DialogContent className="bg-surface-800 text-white max-h-[70vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Cartas Recientes</DialogTitle>
          </DialogHeader>
          <RecentUpdates
            recentUpdates={recentUpdates}
            recentUpdatesError={recentUpdatesError}
            recentUpdatesLoading={recentUpdatesLoading}
            fetchRecentUpdates={fetchRecentUpdates}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}