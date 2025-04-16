'use client'

import { useState, useEffect, useRef } from 'react'
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
import RecentDestinations from './components/RecentDestinations'
import TravelHistory from './components/TravelHistory'
import { FaTimes } from 'react-icons/fa'

const MINIMUM_FARE = 100
const PRICE_PER_BLOCK = 0.5
const TAXI_SERVICE_ACCOUNT = 0;
const POSITION_REFRESH_INTERVAL = 5000;

interface Position {
  x: number
  z: number
}

interface TripRecord {
  id: string;
  destination: string;
  date: Date;
  price: number;
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
}

export default function TaxiApp() {
  const { session } = useBoffSession()
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 0, z: 0 })
  const [playerMoney, setPlayerMoney] = useState(0)
  const [selectedStop, setSelectedStop] = useState<TaxiStop | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [taxiStops, setTaxiStops] = useState<TaxiStop[]>([])
  const [showRecentDrawer, setShowRecentDrawer] = useState(false)
  const isInitialLoad = useRef(true)
  
  const updatePlayerPosition = async () => {
    try {
      const userData = await getMcUserData()
      if (userData.status === 200 && userData.data) {
        setPlayerPosition({ 
          x: Math.floor(userData.data.x), 
          z: Math.floor(userData.data.z) 
        })
      }
    } catch (error) {
      console.error('Error updating player position:', error)
    }
  }
  
  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialLoad.current) return;
      
      setIsLoading(true)
      try {
        const stopsResponse = await smartrotomService.getTaxiStops()
        
        if (stopsResponse.data) {
          const stopsArray = Object.values(stopsResponse.data)
          setTaxiStops(stopsArray)
        } else {
          toast.error('Error al cargar las paradas de taxi')
        }

        await updatePlayerPosition()

        if (session?.user?.smartRotomUser?.uuid) {
          const balanceResponse = await starbankService.getBalance(session.user.smartRotomUser.uuid)
          if (balanceResponse.data) {
            setPlayerMoney(balanceResponse.data.balance)
          }
        } 
        
        isInitialLoad.current = false;
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('No se pudieron cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [session])
  
  useEffect(() => {
    updatePlayerPosition();
    
    const intervalId = setInterval(() => {
      updatePlayerPosition();
    }, POSITION_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, []);

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

  // Handler for selecting a recent stop
  const handleSelectRecentStop = (stop: TaxiStop) => {
    setSelectedStop(stop)
    setShowRecentDrawer(false)
    if (activeTab !== 'list') {
      setActiveTab('list')
    }
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-blue-400 to-blue-600 overflow-hidden">
      <TaxiHeader 
        playerPosition={playerPosition} 
        playerMoney={playerMoney} 
        onHistoryClick={() => setShowRecentDrawer(!showRecentDrawer)} 
      />
      
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