'use client'

import { useState, useEffect } from 'react'
import { MapPin, Compass, Search, ChevronRight } from "lucide-react"
import { WingullService } from "@/services/api/smartrotom/wingullService"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { BasicCard } from "./[pueblo]/_components/shared/cards/BasicCard"
import { SectionTemplate } from "./[pueblo]/_components/shared/section/SectionTemplate"
import { SectionHeader } from "./[pueblo]/_components/shared/section/SectionHeader"
import { OrnamentalDots } from "./[pueblo]/_components/shared/decorative/OrnamentalDots"
import { BackgroundDecorations } from '../_components/BackgroundDecorations'

export default function PueblosPage() {
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
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <BasicCard
          colorClaro={themeColors.colorClaro}
          colorMedio={themeColors.colorMedio}
          colorOscuro={themeColors.colorOscuro}
          className="p-8"
        >
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.colorClaro }} />
            <span className="text-lg text-white">Cargando pueblos...</span>
          </div>
        </BasicCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <SectionTemplate
        colorClaro={themeColors.colorClaro}
        colorMedio={themeColors.colorMedio}
        colorOscuro={themeColors.colorOscuro}
        backgroundGradient="bg-gradient-to-br from-surface-800 to-surface-900"
      >
        <BackgroundDecorations includeGradient={false} />
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title={<span style={{color: themeColors.colorClaro}}>Pueblos</span>}
            subtitle={<span style={{color: themeColors.colorMedio}}>Disponibles</span>}
            description={<span>Explora todos los pueblos disponibles en la región</span>}
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <Input
                    type="text"
                    placeholder="Buscar pueblo..."
                    variant={'wingull'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-surface-50/10 border-surface-50/20 text-surface-50 placeholder-surface-100 focus:border-surface-50/40 focus:bg-surface-50/15"
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
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50 text-surface-400" />
                  <h3 className="text-xl font-semibold mb-2 text-white">No se encontraron pueblos</h3>
                  <p className="text-surface-400">
                    No hay pueblos que coincidan con "{searchTerm}"
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
                    {towns.length} pueblos disponibles
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
          
          <p className="text-surface-300 text-sm mb-6">
            Descubre las parcelas disponibles y comodidades de {townName}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-surface-400 group-hover:text-white transition-colors">
              <span>Explorar pueblo</span>
            </div>
            
            <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </BasicCard>
    </Link>
  )
}
