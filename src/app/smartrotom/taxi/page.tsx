'use client'

import { useState, useEffect } from 'react'
import { useBoffSession } from "@/services/useBoffSession"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { smartrotomService } from "@/services/api/smartrotom/smartrotomService"
import { starbankService } from "@/services/api/smartrotom/starbankService"
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { getMcUserData } from '@/services/mcef/mcefApi'
import TaxiHeader from './components/TaxiHeader'
import TabNavigation from './components/TabNavigation'
import MapView from './components/MapView'
import ListView from './components/ListView'
import LoadingOverlay from './components/LoadingOverlay'
import SelectedStopDetails from './components/SelectedStopDetails'

const MINIMUM_FARE = 100
const PRICE_PER_BLOCK = 0.5
const TAXI_SERVICE_ACCOUNT = 0;

interface Position {
  x: number
  z: number
}

export default function TaxiApp() {
  const { session } = useBoffSession()
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 0, z: 0 })
  const [playerMoney, setPlayerMoney] = useState(0)
  const [selectedStop, setSelectedStop] = useState<TaxiStop | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [taxiStops, setTaxiStops] = useState<TaxiStop[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch taxi stops from the API
        const stopsResponse = await smartrotomService.getTaxiStops()
        
        if (stopsResponse.data) {
          // Convert Record<string, TaxiStop> to TaxiStop[]
          const stopsArray = Object.values(stopsResponse.data)
          setTaxiStops(stopsArray)
        } else {
          toast.error('Error al cargar las paradas de taxi')
        }

        // Fetch player position and money
        const userData = await getMcUserData()
        if (userData.status === 200 && userData.data) {
          setPlayerPosition({ 
            x: Math.floor(userData.data.x), 
            z: Math.floor(userData.data.z) 
          })
        } 

        // Get player balance if session exists
        if (session?.user?.smartRotomUser?.uuid) {
          const balanceResponse = await starbankService.getBalance(session.user.smartRotomUser.uuid)
          if (balanceResponse.data) {
            setPlayerMoney(balanceResponse.data.balance)
          }
        } else {
          // Placeholder for testing
          setPlayerMoney(10000)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('No se pudieron cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [session])

  const calculateDistance = (x1: number, z1: number, x2: number, z2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2))
  }

  const calculatePrice = (distance: number) => {
    return Math.ceil(MINIMUM_FARE + (distance * PRICE_PER_BLOCK))
  }

  const teleportPlayer = async (stop: TaxiStop) => {
    const distance = calculateDistance(playerPosition.x, playerPosition.z, stop.x, stop.z)
    const price = calculatePrice(distance)
    
    if (playerMoney < price) {
      toast.error('No tienes suficiente dinero para este viaje')
      return
    }

    setIsLoading(true)
    try {
      if (session?.user?.smartRotomUser?.uuid) {
        // Process payment through StarBank
        await starbankService.transferFromMain({
          uuid: session.user.smartRotomUser.uuid,
          to: TAXI_SERVICE_ACCOUNT,
          amount: price,
          concept: `Taxi a ${stop.id}`,
        })

        await smartrotomService.teleportPlayer({
          id: stop.id,
          uuid: session.user.smartRotomUser.uuid
        })
      }
      
      // Update local state
      setPlayerPosition({ x: stop.x, z: stop.z })
      setPlayerMoney(playerMoney - price)
      toast.success(`¡Has llegado a ${stop.id}!`)
      setSelectedStop(null)
    } catch (error) {
      console.error('Teleport error:', error)
      toast.error('No se pudo completar el viaje. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDistance = (distance: number) => {
    return Math.round(distance).toLocaleString()
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-yellow-400 to-yellow-600 overflow-hidden">
      <TaxiHeader playerPosition={playerPosition} playerMoney={playerMoney} />
      
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content Area */}
      <div className="absolute top-28 bottom-0 left-0 right-0 p-4 overflow-y-auto">
      {activeTab === 'map' && (
        <MapView 
          taxiStops={taxiStops} 
          playerPosition={playerPosition} 
          selectedStop={selectedStop} 
          setSelectedStop={setSelectedStop} 
        />
      )}
        {activeTab === 'list' && (
          <ListView
            taxiStops={taxiStops}
            playerPosition={playerPosition}
            playerMoney={playerMoney}
            selectedStop={selectedStop}
            setSelectedStop={setSelectedStop}
            calculateDistance={calculateDistance}
            calculatePrice={calculatePrice}
            formatDistance={formatDistance}
            teleportPlayer={teleportPlayer}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Selected Stop Details (Map View) */}
      {activeTab === 'map' && selectedStop && (
        <SelectedStopDetails
          selectedStop={selectedStop}
          playerPosition={playerPosition}
          playerMoney={playerMoney}
          calculateDistance={calculateDistance}
          calculatePrice={calculatePrice}
          formatDistance={formatDistance}
          teleportPlayer={teleportPlayer}
          isLoading={isLoading}
          onClose={() => setSelectedStop(null)}
        />
      )}

      {isLoading && <LoadingOverlay />}
      
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}