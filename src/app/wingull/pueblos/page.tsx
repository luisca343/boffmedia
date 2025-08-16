'use client'

import { useState, useEffect } from 'react'
import { BackgroundDecorations } from "../_components/BackgroundDecorations"
import Footer from "../_components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Compass, Search } from "lucide-react"
import { WingullService } from "@/services/api/smartrotom/wingullService"
import { Input } from "@/components/ui/input"

export default function PueblosPage() {
  const [towns, setTowns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
      <div className="min-h-screen flex flex-col text-white relative">
        <BackgroundDecorations includeGradient={false} />
        <main className="flex-grow container mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-300 mx-auto mb-4"></div>
              <p className="text-xl text-secondary-100">Cargando pueblos...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col text-white relative">
      <BackgroundDecorations includeGradient={false} />
      <main className="flex-grow container mx-auto px-4 py-8 relative">
        <div className="text-center mb-12 relative text-shadow-border2">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                <MapPin className="h-8 w-8 text-black" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-yellow-300 drop-shadow-lg">
              Pueblos y Ciudades
            </h1>
            <p className="text-xl sm:text-2xl text-secondary-100 mb-8 leading-relaxed">
              Explora todos los pueblos disponibles en la región de Teras
            </p>
            <div className="flex justify-center mb-8">
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/50 text-yellow-300 px-4 py-2 text-lg">
                <Compass className="w-4 h-4 mr-2" />
                {towns.length} Pueblos Disponibles
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-4 w-4" />
              <Input
                placeholder="Buscar pueblo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary-800/50 border-secondary-600 text-white placeholder-secondary-400 focus:border-yellow-400"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-16">
          {filteredTowns.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 text-secondary-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-secondary-300 mb-2">
                No se encontraron pueblos
              </h3>
              <p className="text-secondary-400">
                Intenta ajustar tu búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTowns.map((town) => (
                <Card 
                  key={town}
                  className="group relative bg-secondary-900/40 backdrop-blur-sm border border-secondary-500/30 hover:border-yellow-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/20 text-white overflow-hidden"
                >
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-xl font-bold text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300">
                      {town}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <Button 
                      variant="outline"
                      className="w-full border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 bg-transparent group-hover:border-yellow-300 transition-all duration-300"
                    >
                      Más información
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
