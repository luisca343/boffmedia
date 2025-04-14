'use client'

import { useState, useEffect } from 'react'
import { useBoffSession } from "@/services/useBoffSession"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaMapMarkerAlt, FaCoins, FaTaxi, FaMapMarkedAlt, FaUserCircle, FaArrowRight, FaWalking, FaInfoCircle } from 'react-icons/fa'
import { smartrotomService } from "@/services/api/smartrotom/smartrotomService"
import { starbankService } from "@/services/api/smartrotom/starbankService"
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { taxiTeleport } from '@/services/mcef/mcefApi'
import { getMcUserData } from '@/services/mcef/mcefApi'

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
          // In a real implementation, you would parse coordinates from userData
          // For now, using placeholder values
          setPlayerPosition({ x: 50, z: 50 })
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
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 bg-yellow-500 p-4 shadow-md z-10 flex justify-between items-center">
        <div className="flex items-center">
          <FaTaxi className="text-white text-3xl mr-2" />
          <h1 className="text-2xl font-bold text-white">Taxi de Teras</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-yellow-600 px-3 py-1 rounded-full">
            <FaUserCircle className="text-white mr-2" />
            <span className="text-white font-semibold">
              {playerPosition.x}, {playerPosition.z}
            </span>
          </div>
          <div className="flex items-center bg-yellow-600 px-3 py-1 rounded-full">
            <FaCoins className="text-white mr-2" />
            <span className="text-white font-semibold">${playerMoney}</span>
          </div>
        </div>
      </div>

      {/* Rest of the component remains largely the same */}
      {/* Tab Navigation */}
      <div className="absolute top-16 left-0 right-0 flex z-10">
        <button 
          className={`flex-1 py-3 font-medium ${activeTab === 'map' ? 'bg-yellow-600 text-white' : 'bg-yellow-400 text-yellow-800'}`}
          onClick={() => setActiveTab('map')}
        >
          <FaMapMarkedAlt className="inline mr-2" /> Mapa
        </button>
        <button 
          className={`flex-1 py-3 font-medium ${activeTab === 'list' ? 'bg-yellow-600 text-white' : 'bg-yellow-400 text-yellow-800'}`}
          onClick={() => setActiveTab('list')}
        >
          <FaWalking className="inline mr-2" /> Destinos
        </button>
      </div>

      {/* Content Area */}
      <div className="absolute top-28 bottom-0 left-0 right-0 p-4 overflow-y-auto">
        {activeTab === 'map' && (
          <div className="relative bg-yellow-100 rounded-xl shadow-lg h-full flex flex-col">
            <div className="p-4 bg-yellow-200 rounded-t-xl">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Mapa de Destinos</h2>
              <p className="text-yellow-700">Selecciona un destino en el mapa para viajar</p>
            </div>
            <div className="flex-grow relative bg-yellow-50 p-4">
              {/* Simulated Map View */}
              <div className="absolute inset-0 bg-[#2C8C99] overflow-hidden">
                {/* Map Grid Lines */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
                
                {/* Player Position Indicator */}
                <div 
                  className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{ 
                    left: '50%', 
                    top: '50%'
                  }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-40"></div>
                    <div className="absolute inset-0 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white font-bold text-xs">TÚ</span>
                    </div>
                  </div>
                </div>

                {/* Taxi Stop Markers */}
                {taxiStops.map((stop) => (
                  <div 
                    key={stop.id} 
                    className={`absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-125 ${selectedStop?.id === stop.id ? 'z-20' : 'z-10'}`}
                    style={{ 
                      left: `${50 + (stop.x - playerPosition.x) / 10}%`, 
                      top: `${50 + (stop.z - playerPosition.z) / 10}%`,
                      filter: selectedStop?.id === stop.id ? 'drop-shadow(0 0 8px yellow)' : 'none'
                    }}
                    onClick={() => setSelectedStop(stop)}
                  >
                    <FaMapMarkerAlt className={`text-3xl ${selectedStop?.id === stop.id ? 'text-yellow-400' : 'text-red-500'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-yellow-50 rounded-xl shadow-lg h-full overflow-y-auto">
            <div className="p-4 bg-yellow-200 sticky top-0 z-10 rounded-t-xl">
              <h2 className="text-xl font-semibold text-yellow-800">Destinos Disponibles</h2>
              <p className="text-yellow-700">Elige un destino para viajar en taxi</p>
            </div>
            <div className="p-4">
              {taxiStops.map((stop) => {
                const distance = calculateDistance(playerPosition.x, playerPosition.z, stop.x, stop.z)
                const price = calculatePrice(distance)
                const canAfford = playerMoney >= price

                return (
                  <div 
                    key={stop.id} 
                    className={`mb-4 bg-white rounded-lg shadow-md overflow-hidden border-2 ${selectedStop?.id === stop.id ? 'border-yellow-500' : 'border-transparent'}`}
                    onClick={() => setSelectedStop(stop)}
                  >
                    <div className="p-4 flex justify-between items-center cursor-pointer">
                      <div className="flex items-center">
                        <div className="bg-yellow-500 p-2 rounded-full mr-3">
                          <FaMapMarkerAlt className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{stop.id}</h3>
                          <p className="text-sm text-gray-500">Distancia: {formatDistance(distance)} bloques</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                          ${price}
                        </div>
                      </div>
                    </div>

                    {selectedStop?.id === stop.id && (
                      <div className="bg-yellow-50 p-4 border-t border-yellow-100">
                        <p className="mb-3 text-gray-600">{stop.description}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <FaInfoCircle className="mr-1" /> 
                          Coordenadas: X: {stop.x}, Z: {stop.z}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            teleportPlayer(stop);
                          }}
                          disabled={!canAfford || isLoading}
                          className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
                            canAfford && !isLoading 
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isLoading ? (
                            <span>Viajando...</span>
                          ) : (
                            <>
                              <span>{canAfford ? 'Viajar ahora' : 'Fondos insuficientes'}</span>
                              {canAfford && <FaArrowRight className="ml-2" />}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Stop Details (Map View) */}
      {activeTab === 'map' && selectedStop && (
        <div className="absolute left-4 right-4 bottom-4 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-yellow-400 z-30">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedStop.id}</h3>
                <p className="text-gray-600 mb-2">{selectedStop.description}</p>
              </div>
              <div className="bg-yellow-100 px-3 py-1 rounded-full">
                <span className="text-yellow-800 font-medium">
                  ${calculatePrice(calculateDistance(playerPosition.x, playerPosition.z, selectedStop.x, selectedStop.z))}
                </span>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <FaMapMarkerAlt className="mr-1" /> 
              X: {selectedStop.x}, Z: {selectedStop.z} 
              <span className="mx-2">•</span> 
              <FaWalking className="mr-1" /> 
              {formatDistance(calculateDistance(playerPosition.x, playerPosition.z, selectedStop.x, selectedStop.z))} bloques
            </div>
            
            <button
              onClick={() => teleportPlayer(selectedStop)}
              disabled={playerMoney < calculatePrice(calculateDistance(playerPosition.x, playerPosition.z, selectedStop.x, selectedStop.z)) || isLoading}
              className={`w-full py-3 rounded-md font-medium ${
                playerMoney >= calculatePrice(calculateDistance(playerPosition.x, playerPosition.z, selectedStop.x, selectedStop.z)) && !isLoading
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Viajando...' : 'Viajar a este destino'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <FaTaxi className="text-yellow-500 text-5xl mx-auto mb-3 animate-bounce" />
            <p className="text-xl font-medium">Tu taxi está en camino...</p>
          </div>
        </div>
      )}
      
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