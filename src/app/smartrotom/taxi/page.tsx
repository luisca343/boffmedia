'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { rotomPOST } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession"
import { MapPin, DollarSign } from "lucide-react"

const MINIMUM_FARE = 100
const PRICE_PER_BLOCK = 0.5

export default function TaxiApp() {
  const { session } = useBoffSession()
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 0 })
  const [playerMoney, setPlayerMoney] = useState(0)

  useEffect(() => {
    const fetchPlayerData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPlayerPosition({ x: 50, z: 50 })
      setPlayerMoney(10000)
    }
    fetchPlayerData()
  }, [])

  const calculateDistance = (x1: number, z1: number, x2: number, z2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2))
  }

  const calculatePrice = (distance: number) => {
    return Math.ceil(MINIMUM_FARE + (distance * PRICE_PER_BLOCK))
  }

interface TaxiStop {
    id: number
    name: string
    x: number
    z: number
}

interface Position {
    x: number
    z: number
}

const taxiStops: TaxiStop[] = [
    { id: 1, name: "Pueblo Tulipán", x: -2100, z: 300 },
    { id: 2, name: "Pueblo Shiroi", x: 1500, z: 500 },
    { id: 3, name: "Pueblo Takai", x: 1500, z: 2300 },
    { id: 4, name: "Pueblo Hagane", x: -2700, z: 500 },
    { id: 5, name: "Pueblo Dento", x: -4400, z: -7000 },
]

const teleportPlayer = async (stopId: number, price: number) => {
    if (playerMoney < price) return

    try {
        /*
        await rotomPOST("/starbank/transfer", {
            from: session.user.smartRotomUser.uuid,
            to: "TAXI_SERVICE_ACCOUNT",
            amount: price,
            concept: `Taxi a ${taxiStops.find(stop => stop.id === stopId)?.name}`,
        })*/

        const newPosition = taxiStops.find(stop => stop.id === stopId)
        if (newPosition) {
            setPlayerPosition({ x: newPosition.x, z: newPosition.z })
            setPlayerMoney(playerMoney - price)
            alert(`¡Teletransportado a ${newPosition.name}!`)
        }
    } catch (error) {
        console.error("Falló la teletransportación:", error)
        alert("No se pudo teletransportar. Por favor, inténtalo de nuevo.")
    }
}

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Servicio de Taxi de Teras</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <p>Tu posición: X: {playerPosition.x}, Z: {playerPosition.z}</p>
          <p>Tu dinero: <DollarSign className="inline-block w-4 h-4" /> {playerMoney}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taxiStops.map((stop) => {
            const distance = calculateDistance(playerPosition.x, playerPosition.z, stop.x, stop.z)
            const price = calculatePrice(distance)
            const canAfford = playerMoney >= price

            return (
              <Button
                key={stop.id}
                onClick={() => teleportPlayer(stop.id, price)}
                disabled={!canAfford}
                className={`flex justify-between items-center p-4 ${!canAfford ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center">
                  <MapPin className="mr-2" />
                  <span>{stop.name}</span>
                </div>
                <span><DollarSign className="inline-block w-4 h-4" /> {price}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}