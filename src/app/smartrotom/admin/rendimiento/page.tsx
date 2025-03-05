"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Server, BarChart2 } from 'lucide-react'
import { useGetPerformance } from '@/hooks/_main/useGetPerformance'
import { useEffect } from 'react'

const performanceApps = [
  {
    nombre: "TPS",
    descripcion: "Ticks Por Segundo",
    icono: <Activity className="w-6 h-6" />,
    getValue: (performance: { tps: string }) => parseInt(performance.tps).toFixed(2)
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
  }, [])

  if (!performance) {
    return <div className="w-full min-h-screen bg-black text-green-400 font-mono p-4 flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="w-full min-h-screen bg-black text-green-400 font-mono p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-500 uppercase tracking-widest glitch" style={{textShadow: '2px 2px #00ff00, -2px -2px #0000ff'}}>
        Monitor de Rendimiento del Servidor
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {performanceApps.map((app) => (
          <Card key={app.nombre} className="hover:shadow-neon transition-all duration-300 bg-surface-900 border-green-500 border h-full">
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="bg-green-900 rounded-sm p-2 text-green-400">
                {app.icono}
              </div>
              <CardTitle className="text-green-400 font-bold">{app.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-600">{app.descripcion}</CardDescription>
              <p className="text-2xl font-bold text-green-500 mt-2">{app.getValue(performance)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-green-500 text-sm">Última actualización: {new Date().toLocaleString()}</p>
        <p className="text-green-500 text-sm">Estado: {calcularEstado(parseFloat(performance.tps))}</p>
      </div>
    </div>
  )
}


function calcularEstado(tps: number) {
    // Max 20 TPS
    if (tps < 10) return "El servidor está en llamas"
    if (tps < 15) return "Servidor en estado crítico"
    if (tps < 17) return "Servidor en mal estado"
    if (tps < 18) return "Servidor en estado regular"
    if (tps < 19) return "Servidor en buen estado"
    if(tps < 19.5) return "Servidor en excelente estado"
    return "Servidor en perfecto estado"
}