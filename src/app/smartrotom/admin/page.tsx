"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal, Wifi } from "lucide-react"
import GlitchStyles from './_components/GlitchStyles'

const appsAdmin = [
  {
    nombre: "ArceuSpeak",
    descripcion: "Enviar mensajes al chat",
    icono: <Terminal className="w-6 h-6" />,
    enlace: "/smartrotom/admin/arceuspeak"
  },
  {
    nombre: "OGT Explorer",
    descripcion: "Generar carteles de autopista",
    icono: <Wifi className="w-6 h-6" />,
    enlace: "/smartrotom/admin/carteles"
  }
]

export default function PanelControlAdmin() {
  return (
    <div className="w-full min-h-screen bg-black text-green-400 font-mono p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-500 uppercase tracking-widest glitch" style={{textShadow: '2px 2px #00ff00, -2px -2px #0000ff'}}>
        Terminal de Acceso Restringido
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {appsAdmin.map((app) => (
          <Link href={app.enlace} key={app.nombre} className="block">
            <Card className="hover:shadow-neon transition-all duration-300 bg-surface-900 border-green-500 border h-full">
              <CardHeader className="flex flex-row items-center space-x-4">
                <div className="bg-green-900 rounded-sm p-2 text-green-400">
                  {app.icono}
                </div>
                <CardTitle className="text-green-400 font-bold">{app.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-green-600">{app.descripcion}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-green-500 text-sm">Acceso autorizado: {new Date().toLocaleString()}</p>
        <p className="text-green-500 text-sm">Nivel de seguridad: MÁXIMO</p>
      </div>
      <GlitchStyles />
    </div>
  )
}