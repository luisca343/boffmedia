"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowLeft, ArrowRight, Plus, Minus, Copy, Check } from 'lucide-react'
import HighwaySign from './_components/HighwaySign'
import GlitchStyles from '../_components/GlitchStyles'

export default function CartelesAutopista() {
  const [highway, setHighway] = useState('')
  const [destinations, setDestinations] = useState([{ name: '', distance: '', direction: 'down' }])
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
    let url = `${baseUrl}/highway-sign?highway=${encodeURIComponent(highway)}`
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
    <div className="w-full min-h-screen bg-black text-green-400 font-mono p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-500 uppercase tracking-widest glitch" style={{textShadow: '2px 2px #00ff00, -2px -2px #0000ff'}}>
        Generador de Señales de Carretera
      </h1>
      <Card className="bg-gray-900 border-green-500 border">
        <CardHeader>
          <CardTitle className="text-green-400">Configuración de la Señal</CardTitle>
          <CardDescription className="text-green-600">Ingrese los detalles de la señal de carretera</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="highway" className="text-green-400">Nombre de la Carretera (obligatorio)</Label>
              <Input
                id="highway"
                value={highway}
                onChange={(e) => setHighway(e.target.value)}
                required
                placeholder="ej., A-2"
                className="bg-gray-800 text-green-400 border-green-500"
              />
            </div>
            {destinations.map((dest, index) => (
              <div key={index} className="space-y-2">
                <h2 className="text-lg font-semibold text-green-400">Destino {index + 1}</h2>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor={`dest-${index}`} className="text-green-400">Nombre</Label>
                    <Input
                      id={`dest-${index}`}
                      value={dest.name}
                      onChange={(e) => handleDestinationChange(index, 'name', e.target.value)}
                      placeholder="ej., Madrid"
                      className="bg-gray-800 text-green-400 border-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`dist-${index}`} className="text-green-400">Distancia (bq)</Label>
                    <Input
                      id={`dist-${index}`}
                      value={dest.distance}
                      onChange={(e) => handleDestinationChange(index, 'distance', e.target.value)}
                      placeholder="ej., 300"
                      type="number"
                      className="bg-gray-800 text-green-400 border-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`dir-${index}`} className="text-green-400">Dirección</Label>
                    <Select
                      value={dest.direction}
                      onValueChange={(value) => handleDestinationChange(index, 'direction', value)}
                    >
                      <SelectTrigger id={`dir-${index}`} className="bg-gray-800 text-green-400 border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-green-400 border-green-500 select-content">
                        <SelectItem value="down">
                          <div className="flex items-center">
                            <ArrowDown className="mr-2 h-4 w-4" />
                            <span>Recto</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="left">
                          <div className="flex items-center">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            <span>Izquierda</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="right">
                          <div className="flex items-center">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            <span>Derecha</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="destructive" onClick={() => handleRemoveDestination(index)} className="bg-red-900 hover:bg-red-800">
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {destinations.length < 4 && (
              <Button type="button" onClick={handleAddDestination} className="w-full bg-green-900 hover:bg-green-800 text-green-400">
                <Plus className="mr-2 h-4 w-4" /> Agregar Destino
              </Button>
            )}
            <div className="relative">
              <Input
                value={signUrl}
                readOnly
                className="pr-10 bg-gray-800 text-green-400 border-green-500"
                onClick={copyToClipboard}
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute inset-y-0 right-0 px-3 flex items-center hover:bg-green-900"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-green-400" />}
              </Button>
            </div>
            {copied && <p className="text-sm text-green-500">¡URL copiada al portapapeles!</p>}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6 bg-gray-900 border-green-500 border">
        <CardHeader>
          <CardTitle className="text-green-400">Vista Previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-green-500">
            <HighwaySign highway={highway} destinations={destinations} width={250} height={200} />
          </div>
          <p className="text-sm text-green-600 mt-2">Esta vista previa muestra valores predeterminados para los campos vacíos. La imagen final solo incluirá la información que proporciones.</p>
        </CardContent>
      </Card>
      <GlitchStyles />
    </div>
  )
}