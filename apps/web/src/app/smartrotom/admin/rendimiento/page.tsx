"use client"

import { useEffect } from 'react'
import { Activity, Users, Server, BarChart2 } from 'lucide-react'
import { useGetPerformance } from '@/hooks/_main/useGetPerformance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/card"
import AdminPageLayout from '../_components/AdminPageLayout'
import TerminalCard from '../_components/TerminalCard'
import TerminalHeader from '../_components/TerminalHeader'

const performanceApps = [
  {
    nombre: "TPS",
    descripcion: "Ticks Por Segundo",
    icono: <Activity className="w-6 h-6" />,
    getValue: (performance: { tps: string }) => parseFloat(performance.tps).toFixed(2)
  },
  {
    nombre: "Memoria",
    descripcion: "Uso de memoria",
    icono: <Server className="w-6 h-6" />,
    getValue: (performance: { memory: number }) => `${performance.memory.toFixed(1)}%`
  },
  {
    nombre: "Jugadores",
    descripcion: "Jugadores conectados",
    icono: <Users className="w-6 h-6" />,
    getValue: (performance: { players: any }) => performance.players
  },
  {
    nombre: "Tiempo Activo",
    descripcion: "Tiempo de actividad del servidor",
    icono: <BarChart2 className="w-6 h-6" />,
    getValue: (performance: { uptime: any }) => performance.uptime
  }
]

export default function ServerPerformanceMonitor() {
  const { performance, refetch } = useGetPerformance()
  
  useEffect(() => {
    if(!performance) return
    const interval = setInterval(() => {
      refetch()
    }, 5000)
    return () => clearInterval(interval)
  }, [performance, refetch])

  if (!performance) {
    return (
      <div className="w-full min-h-screen bg-black text-highlight-400 font-mono p-4 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="text-highlight-500 text-xl mb-2">Inicializando sistema de monitoreo...</div>
          <div className="w-40 h-1 bg-highlight-700/30 rounded">
            <div className="h-1 bg-highlight-500 rounded animate-[loadingBar_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
          </div>
        </div>
        <style jsx>{`
          @keyframes loadingBar {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AdminPageLayout title="Monitor de Rendimiento" version="2.0.1" addBackgroundEffects={true}>
      <TerminalHeader title="performance-monitor" username="ficus-labs" />
      <TerminalCard 
        title="Estado del Servidor" 
        description="Monitoreo en tiempo real de los recursos del servidor"
        roundedTop={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceApps.map((app) => (
            <Card key={app.nombre} className="bg-black border border-highlight-600/30 hover:border-highlight-400 rounded-md overflow-hidden transition-all duration-300 hover:shadow-neon">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-highlight-800/50">
                <div className="flex items-center space-x-3">
                  <div className="bg-highlight-950 p-2 rounded-md text-highlight-400">
                    {app.icono}
                  </div>
                  <CardTitle className="text-highlight-400 font-bold text-lg">{app.nombre}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CardDescription className="text-highlight-600/80 mb-2">
                  <span className="text-highlight-600/60">{"//"} </span>
                  {app.descripcion}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-mono font-bold text-highlight-500">{app.getValue(performance)}</p>
                  {app.nombre === "TPS" && (
                    <div className="h-2 w-16 bg-black rounded-full overflow-hidden border border-highlight-900/50">
                      <div 
                        className={`h-full ${getStatusColor(parseFloat(performance.tps))}`} 
                        style={{width: `${Math.min(100, (parseFloat(performance.tps) / 20) * 100)}%`}}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 p-4 border border-highlight-800/40 rounded-md bg-black/60">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-highlight-500 text-sm mb-2 sm:mb-0">
              <span className="text-highlight-600 mr-2">▶</span>
              Última actualización: {new Date().toLocaleString()}
            </p>
            <p className="text-sm font-medium flex items-center">
              <span className="text-highlight-600 mr-2">◉</span>
              Estado: <span className={`ml-2 ${getStatusTextColor(parseFloat(performance.tps))}`}>{calcularEstado(parseFloat(performance.tps))}</span>
            </p>
          </div>
        </div>
        
        <div className="mt-4 border-t border-highlight-700/30 pt-2">
          <div className="flex justify-between text-xs text-highlight-700">
            <span>INTERVALO:</span>
            <span className="text-highlight-400 flex items-center">
              5s
              <span className="w-2 h-2 bg-highlight-500 animate-pulse rounded-full ml-2"></span>
            </span>
          </div>
          <div className="flex justify-between text-xs text-highlight-700">
            <span>ESTADO:</span>
            <span className="text-highlight-400">ACTIVO</span>
          </div>
        </div>
      </TerminalCard>
      
      <div className="text-xs text-highlight-700 mt-2 text-center">
        Performance Monitor | Sistema de Monitorización | Acceso Restringido
      </div>
    </AdminPageLayout>
  )
}

function getStatusColor(tps: number) {
  if (tps < 10) return "bg-red-500";
  if (tps < 15) return "bg-orange-500";
  if (tps < 17) return "bg-yellow-500";
  if (tps < 18) return "bg-highlight-600";
  if (tps < 19) return "bg-highlight-500";
  return "bg-emerald-400";
}

function getStatusTextColor(tps: number) {
  if (tps < 10) return "text-red-500";
  if (tps < 15) return "text-orange-500";
  if (tps < 17) return "text-yellow-500";
  if (tps < 18) return "text-highlight-600";
  if (tps < 19) return "text-highlight-500";
  return "text-emerald-400";
}

function calcularEstado(tps: number) {
  // Max 20 TPS
  if (tps < 10) return "El servidor está en llamas";
  if (tps < 15) return "Servidor en estado crítico";
  if (tps < 17) return "Servidor en mal estado";
  if (tps < 18) return "Servidor en estado regular";
  if (tps < 19) return "Servidor en buen estado";
  if (tps < 19.5) return "Servidor en excelente estado";
  return "Servidor en perfecto estado";
}