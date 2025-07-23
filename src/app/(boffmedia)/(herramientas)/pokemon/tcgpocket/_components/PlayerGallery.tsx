'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from 'lucide-react'
import { useLocale, useTranslations } from "next-intl"
import { toast } from 'react-toastify'
import { boffPOST, boffGET } from "@/services/boffAPI"
import { usePathname } from "next/navigation"
import { useGalleryData } from "../galeria/_hooks/useGalleryData"
import { PlayerGalleryHeader } from "./PlayerGalleryHeader"
import { RecentUpdates } from "./RecentUpdates"
import { BestPackDialog } from "./BestPackDialog"
import { RecentUpdate, PackData, AllPackProbabilities } from '../types'
import { FilterComponent } from "./FilterComponent"
import { CollectionGroup } from "./CollectionGroup"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TcgCard } from "@/generated/api"

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
  const [recentUpdates, setRecentUpdates] = useState<any[]>([])
  const [recentUpdatesLoading, setRecentUpdatesLoading] = useState(false)
  const [recentUpdatesOffset, setRecentUpdatesOffset] = useState(0)
  const [recentUpdatesError, setRecentUpdatesError] = useState<string | null>(null)
  const [showAmounts, setShowAmounts] = useState(true)
  const [isRecentUpdatesOpen, setIsRecentUpdatesOpen] = useState(false)
  const t = useTranslations('tcgpocket')
  const [nameFilter, setNameFilter] = useState("")
  const [expansionFilter, setExpansionFilter] = useState("")
  const locale = useLocale()

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
        //toast.info('No more updates to load')
      }
    } catch (error) {
      console.error('Error fetching recent updates:', error)
      setRecentUpdatesError(t('gallery.errors.recentUpdates'))
      toast.error(t('gallery.errors.recentUpdates'))
    } finally {
      setRecentUpdatesLoading(false)
    }
  }

  const handleAddCard = (card: TcgCard) => {
    const key = card.id;
    setChanges(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
  }

  const handleRemoveCard = (card: TcgCard) => {
    const key = card.id;
    const currentCount = userCards[key] || 0
    const changeCount = changes[key] || 0
    if (currentCount + changeCount > 0) {
      setChanges(prev => ({ ...prev, [key]: (prev[key] || 0) - 1 }))
    }
  }

  const saveChanges = async () => {
    const updates = Object.entries(changes).map(([cardId, change]) => ({
      cardId,
      change,
    }))

    await updateUserCards(updates)
    const newUpdates = updates.map(update => ({
      id: Date.now(),
      cardId: update.cardId,
      count: update.change,
      updatedAt: new Date().toISOString(),
      cardName: allCards.find(card => card.id === update.cardId)?.name || t('gallery.unknownCard')
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
          setBestPackData(result.data as { bestPack: PackData, allPackProbabilities: AllPackProbabilities })
          setEventPackData(null)
          setIsDialogOpen(true)
        }
      } else {
        const [type, eventName] = selectedEvent.split(':')
        const result = await boffPOST(`/herramientas/ptcgp/best-pack-for-${type}`, { username, eventName: eventName })
        if (result.message) {
          toast.info(result.message)
        } else {
          setEventPackData(result.data as { bestPack: PackData, allPackProbabilities: AllPackProbabilities, missingEventCards: string[], totalEventCards: number })
          setBestPackData(null)
          setIsDialogOpen(true)
        }
      }
    } catch (error) {
      console.error('Error getting best pack:', error)
      toast.error(t('gallery.errors.bestPack'))
    } finally {
      setBestPackLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white">
      {Object.keys(userCards).length === 0 ? (
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('gallery.notFound.title')}</h2>
          <p>{t('gallery.notFound.description')}</p>
        </div>
      ) : (
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
              expansions={Array.from(new Set(allCards.map(card => card.setName)))}
              onFilterChange={(name, expansion) => {
                setNameFilter(name)
                setExpansionFilter(expansion)
              }}
              t={t}
            />
          </div>
          <div className="mt-8">
            {loading ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : allCards.length === 0 ? (
              <p className="text-center text-surface-300">{t('gallery.noCards')}</p>
            ) : (
              <div>
                {Object.entries(
                  allCards
                    .filter(card =>
                      (card.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                        card.id.toString().includes(nameFilter)) &&
                      (expansionFilter === "" || card.setName === expansionFilter)
                    )
                    .reduce<Record<string, TcgCard[]>>((acc, curr) => {
                      if (!acc[curr.setName]) {
                        acc[curr.setName] = []
                      }
                      acc[curr.setName].push(curr)
                      return acc
                    }, {})
                ).map(([setName, cards]) => (
                  <CollectionGroup
                    key={setName}
                    expansion={setName}
                    cards={cards}
                    userCards={userCards}
                    changes={changes}
                    hideMissingCards={hideMissingCards}
                    editable={editable}
                    loading={loading}
                    handleAddCard={handleAddCard}
                    handleRemoveCard={handleRemoveCard}
                    trans={t}
                    showAmounts={showAmounts}
                  />
                ))}
              </div>
            )}
          </div>
          {editable && Object.keys(changes).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-4 right-4 z-50"
            >
              <Button onClick={saveChanges} className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t('gallery.saveChanges')}
              </Button>
            </motion.div>
          )}
        </div>
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
            <DialogTitle>{t('gallery.recentCards')}</DialogTitle>
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