"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, ArrowLeft, ArrowRight, Plus, Minus, Copy, Check } from 'lucide-react'
import HighwaySign from './_components/HighwaySign'

// Import our reusable terminal components
import AdminPageLayout from '../_components/AdminPageLayout'
import TerminalCard from '../_components/TerminalCard'
import TerminalLabel from '../_components/TerminalLabel'

interface Destination {
  name: string;
  distance: string;
  direction: "down" | "left" | "right";
}

export default function CartelesAutopista() {
  const [highway, setHighway] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([{ name: '', distance: '', direction: 'down' }])
  const [signUrl, setSignUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const handleAddDestination = () => {
    if (destinations.length < 4) {
      setDestinations([...destinations, { name: '', distance: '', direction: 'down' }])
    }
  }

  const handleRemoveDestination = (index: number) => {
    const newDestinations = destinations.filter((_, i) => i !== index)
    setDestinations(newDestinations)
  }

  const handleDestinationChange = (index: number, field: string, value: string) => {
    const newDestinations = [...destinations]
    newDestinations[index] = { ...newDestinations[index], [field]: value }
    setDestinations(newDestinations)
  }

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || ''
    let url = `${baseUrl}/smartrotom/cartel?highway=${encodeURIComponent(highway)}`
    destinations.forEach((dest, index) => {
      if (dest.name || dest.distance) {
        url += `&dest${index + 1}=${encodeURIComponent(dest.name)}&dist${index + 1}=${encodeURIComponent(dest.distance)}&dir${index + 1}=${encodeURIComponent(dest.direction)}`
      }
    })
    setSignUrl(url)
  }, [highway, destinations])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(signUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <AdminPageLayout title="Generador de Señales" version="2.3.4" addBackgroundEffects={true}>
      {/* Main Configuration Card */}
      <TerminalCard 
        title="Configuración de Señal" 
        description="Ingrese los detalles de la señal de carretera"
        terminalTitle="sign-generator"
        username="ficus-labs"
        roundedTop={true}
      >
        <div className="space-y-4">
          <div>
            <TerminalLabel htmlFor="highway" indicator="dot" required>
              Nombre de la Carretera
            </TerminalLabel>
            <Input
              id="highway"
              value={highway}
              onChange={(e) => setHighway(e.target.value)}
              required
              placeholder="ej., A-2"
              className="bg-black text-green-400 border-green-700 focus:border-green-500 focus:ring-0"
            />
          </div>
          
          {destinations.map((dest, index) => (
            <div key={index} className="space-y-2 border border-green-800/30 p-3 rounded">
              <h2 className="text-lg font-semibold text-green-400 flex items-center">
                <span className="text-green-600 w-6">{index + 1}{">"}</span> Destino
              </h2>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <TerminalLabel htmlFor={`dest-${index}`} indicator="comment">
                    Nombre
                  </TerminalLabel>
                  <Input
                    id={`dest-${index}`}
                    value={dest.name}
                    onChange={(e) => handleDestinationChange(index, 'name', e.target.value)}
                    placeholder="ej., Madrid"
                    className="bg-black text-green-400 border-green-700 focus:border-green-500 focus:ring-0"
                  />
                </div>
                <div className="flex-1">
                  <TerminalLabel htmlFor={`dist-${index}`} indicator="comment">
                    Distancia (bq)
                  </TerminalLabel>
                  <Input
                    id={`dist-${index}`}
                    value={dest.distance}
                    onChange={(e) => handleDestinationChange(index, 'distance', e.target.value)}
                    placeholder="ej., 300"
                    type="number"
                    className="bg-black text-green-400 border-green-700 focus:border-green-500 focus:ring-0"
                  />
                </div>
                <div className="flex-1">
                  <TerminalLabel htmlFor={`dir-${index}`} indicator="comment">
                    Dirección
                  </TerminalLabel>
                  <Select
                    value={dest.direction}
                    onValueChange={(value: any) => handleDestinationChange(index, 'direction', value)}
                  >
                    <SelectTrigger id={`dir-${index}`} className="bg-black text-green-400 border-green-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-green-400 border-green-700 select-content">
                      <SelectItem value="down" className="hover:bg-green-900/30">
                        <div className="flex items-center">
                          <ArrowDown className="mr-2 h-4 w-4" />
                          <span>Recto</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="left" className="hover:bg-green-900/30">
                        <div className="flex items-center">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          <span>Izquierda</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="right" className="hover:bg-green-900/30">
                        <div className="flex items-center">
                          <ArrowRight className="mr-2 h-4 w-4" />
                          <span>Derecha</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button" 
                  onClick={() => handleRemoveDestination(index)} 
                  className="bg-red-900/60 hover:bg-red-800 text-red-100 border border-red-700 hover:shadow-[0_0_5px_rgba(220,38,38,0.5)] transition-all h-10 mt-auto"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {destinations.length < 4 && (
            <Button 
              type="button" 
              onClick={handleAddDestination} 
              className="w-full bg-green-900/30 hover:bg-green-800/50 text-green-400 border border-green-700 hover:shadow-neon transition-all flex items-center justify-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Destino
            </Button>
          )}
          
          <div className="relative border-t border-green-700/30 pt-4 mt-4">
            <div className="text-xs text-green-600 mb-2 flex items-center">
              <span className="animate-pulse text-green-500 mr-2">[URL]</span>
              Click para copiar
            </div>
            <Input
              value={signUrl}
              readOnly
              className="pr-10 bg-black text-green-400 border-green-700 font-mono text-xs"
              onClick={copyToClipboard}
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute inset-y-0 right-0 px-3 flex items-center hover:bg-green-900/30 top-4"
              onClick={copyToClipboard}
            >
              {copied ? 
                <Check className="h-4 w-4 text-green-500" /> : 
                <Copy className="h-4 w-4 text-green-400" />
              }
            </Button>
            {copied && <p className="text-sm text-green-500 mt-1 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              URL copiada al portapapeles
            </p>}
          </div>
        </div>
      </TerminalCard>
      
      {/* Preview Card */}
      <TerminalCard 
        title="Vista Previa"
        className="mt-6"
      >
        <div className="flex justify-center bg-black/60 p-2 rounded border border-green-900/30">
          <HighwaySign highway={highway} destinations={destinations} width={500} height={300} />
        </div>
      </TerminalCard>
    </AdminPageLayout>
  )
}