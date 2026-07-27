'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, Compass, Search, ChevronRight } from "lucide-react"
import { WingullService } from "@/services/api/smartrotom/wingullService"
import { Input } from "@/components/ui/primitives/input"
import Link from "next/link"
import { BasicCard } from "./[pueblo]/_components/shared/cards/BasicCard"
import { SectionTemplate } from "./[pueblo]/_components/shared/section/SectionTemplate"
import { SectionHeader } from "./[pueblo]/_components/shared/section/SectionHeader"
import { OrnamentalDots } from "./[pueblo]/_components/shared/decorative/OrnamentalDots"
import { BackgroundDecorations } from '../_components/BackgroundDecorations'

export default function PueblosPage() {
  const t = useTranslations('wingull.towns')
  const [towns, setTowns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Theme colors consistent with individual town pages
  const themeColors = {
    colorClaro: '#a5f3fc',    // Light blue
    colorMedio: '#22d3ee',    // Medium blue  
    colorOscuro: '#155b75',   // Dark blue
  }

  useEffect(() => {
    const fetchTowns = async () => {
      try {
        const response = await WingullService.getAllTowns()
        if (response) {
          setTowns(response.data!)
        }
      } catch (error) {
        console.error('Error fetching towns:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTowns()
  }, [])

  const filteredTowns = towns.filter(town =>
    town.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-layer-1 flex items-center justify-center">
        <BasicCard
          colorClaro={themeColors.colorClaro}
          colorMedio={themeColors.colorMedio}
          colorOscuro={themeColors.colorOscuro}
          className="p-8"
        >
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.colorClaro }} />
            <span className="text-lg text-white">{t('loading')}</span>
          </div>
        </BasicCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-layer-1">
      <SectionTemplate
        colorClaro={themeColors.colorClaro}
        colorMedio={themeColors.colorMedio}
        colorOscuro={themeColors.colorOscuro}
        backgroundGradient="bg-gradient-to-br from-layer-2 to-layer-1"
      >
        <BackgroundDecorations includeGradient={false} />
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title={<span style={{color: themeColors.colorClaro}}>{t('titlePrimary')}</span>}
            subtitle={<span style={{color: themeColors.colorMedio}}>{t('titleAccent')}</span>}
            description={<span>{t('description')}</span>}
            townName="Wingull"
            colorClaro={themeColors.colorClaro}
            colorMedio={themeColors.colorMedio}
            colorOscuro={themeColors.colorOscuro}
          />

          {/* Search Section */}
          <div className="mb-12 flex justify-center">
            <BasicCard
              colorClaro={themeColors.colorClaro}
              colorMedio={themeColors.colorMedio}
              colorOscuro={themeColors.colorOscuro}
              className="w-full max-w-md"
            >
              <div className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-muted" />
                  <Input
                    type="text"
                    placeholder={t('searchPh')}
                    variant={'wingull'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-base/10 border-edge/20 text-ink placeholder-ink-dim focus:border-edge/40 focus:bg-base/15"
                  />
                </div>
              </div>
            </BasicCard>
          </div>

          {/* Towns Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTowns.map((town, index) => (
              <TownCard 
                key={town} 
                townName={town} 
                themeColors={themeColors}
                index={index}
              />
            ))}
          </div>

          {filteredTowns.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <BasicCard
                colorClaro={themeColors.colorClaro}
                colorMedio={themeColors.colorMedio}
                colorOscuro={themeColors.colorOscuro}
                className="max-w-md mx-auto"
              >
                <div className="p-8">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50 text-ink-muted" />
                    <h3 className="text-xl font-semibold mb-2 text-white">{t('emptyTitle')}</h3>
                    <p className="text-ink-muted">
                      {t('emptyBody', { query: searchTerm })}
                    </p>
                </div>
              </BasicCard>
            </div>
          )}

          {/* Summary info */}
          <div className="mt-16 text-center">
            <BasicCard
              colorClaro={themeColors.colorClaro}
              colorMedio={themeColors.colorMedio}
              colorOscuro={themeColors.colorOscuro}
              className="max-w-md mx-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Compass className="w-6 h-6" style={{ color: themeColors.colorClaro }} />
                  <span className="text-lg font-semibold text-white">
                    {t('count', { count: towns.length })}
                  </span>
                </div>
                <OrnamentalDots
                  colorClaro={themeColors.colorClaro}
                  colorMedio={themeColors.colorMedio}
                  colorOscuro={themeColors.colorOscuro}
                  size="small"
                />
              </div>
            </BasicCard>
          </div>
        </div>
      </SectionTemplate>
    </div>
  )
}

interface TownCardProps {
  townName: string
  themeColors: {
    colorClaro: string
    colorMedio: string
    colorOscuro: string
  }
  index: number
}

function TownCard({ townName, themeColors, index }: TownCardProps) {
  const t = useTranslations('wingull.towns')

  return (
    <Link href={`/wingull/pueblos/${townName}`}>
      <BasicCard
        colorClaro={themeColors.colorClaro}
        colorMedio={themeColors.colorMedio}
        colorOscuro={themeColors.colorOscuro}
        className="h-full transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: themeColors.colorClaro }}
            />
            <MapPin className="w-5 h-5" style={{ color: themeColors.colorMedio }} />
          </div>

          <h3 className="text-xl font-bold mb-3 capitalize" style={{ color: themeColors.colorClaro }}>
            {townName}
          </h3>
          
          <p className="text-ink text-sm mb-6">
            {t('cardDesc', { town: townName })}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-ink-muted group-hover:text-white transition-colors">
              <span>{t('explore')}</span>
            </div>
            
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </BasicCard>
    </Link>
  )
}
