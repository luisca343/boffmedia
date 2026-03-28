'use client'

import { useState, useEffect, useRef } from 'react'
import { useBoffSession } from "@/services/useBoffSession"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SmartrotomService } from "@/services/api/smartrotom/smartrotomService"
import { StarbankService } from "@/services/api/smartrotom/starbankService"
import { TaxiStop } from "@boffmedia/shared"
import { TaxiStopExtended } from "@/types"
import { getMcUserData } from '@/services/mcef/mcefApi'
import TaxiHeader from './components/TaxiHeader'
import TabNavigation from './components/TabNavigation'
import MapView from './components/MapView'
import ListView from './components/ListView'
import LoadingOverlay from './components/LoadingOverlay'
import SelectedStopDetails from './components/SelectedStopDetails'
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { MINIMUM_FARE, POSITION_REFRESH_INTERVAL, PRICE_PER_BLOCK, TAXI_SERVICE_ACCOUNT } from './utils/constants'

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
  // State and function declarations
  const { session } = useBoffSession()
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 0, z: 0 })
  const [playerMoney, setPlayerMoney] = useState(0)
  const [selectedStop, setSelectedStop] = useState<TaxiStopExtended | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [taxiStops, setTaxiStops] = useState<TaxiStopExtended[]>([])
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
        const stopsResponse = await WingullService.getTaxiStops()
        
        if (stopsResponse.data) {
          const stopsArray = Object.values(stopsResponse.data)
          setTaxiStops(stopsArray)
        } else {
          toast.error('Error al cargar las paradas de taxi')
        }

        await updatePlayerPosition()

        if (session?.user?.smartRotomUser?.uuid) {
          const balanceResponse = await StarbankService.getUserBalance(session.user.smartRotomUser.uuid)
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

  const teleportPlayer = async (stop: TaxiStopExtended) => {
    const distance = calculateDistance(playerPosition.x, playerPosition.z, stop.x, stop.z)
    const price = calculatePrice(distance)
    
    if (playerMoney < price) {
      toast.error('No tienes suficiente dinero para este viaje')
      return
    }

    setIsLoading(true)
    try {
      if (session?.user?.smartRotomUser?.uuid) {
        const res = await StarbankService.transferFromMain({
          uuid: session.user.smartRotomUser.uuid,
          to: TAXI_SERVICE_ACCOUNT,
          amount: price,
          concept: `Taxi a ${stop.id}`,
        })

        if (!res.success) {
          toast.error('Error al procesar el pago del taxi')
          return
        }

        await WingullService.teleportPlayer({
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

  const handleSelectRecentStop = (stop: TaxiStop) => {
    setSelectedStop(stop)
    setShowRecentDrawer(false)
    if (activeTab !== 'list') {
      setActiveTab('list')
    }
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#0A2463] via-[#1E3A8A] to-[#2563EB] overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      }}></div>

      {/* Decorative elements for a more dynamic look */}
      <div className="absolute top-[20%] left-[5%] w-12 h-12 bg-white/5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-[15%] right-[10%] w-20 h-20 bg-yellow-400/10 rounded-full blur-3xl"></div>
      <div className="absolute top-[60%] left-[30%] w-32 h-32 bg-secondary-300/5 rounded-full blur-2xl"></div>

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
        theme="dark"
      />
    </div>
  )
}