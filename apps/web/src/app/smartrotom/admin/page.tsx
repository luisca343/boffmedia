"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/card"
import { Terminal, Wifi, Shield, Database, AlertTriangle } from "lucide-react"
import GlitchStyles from './_components/GlitchStyles'
import MatrixRain from './_components/MatrixRain'
import Scanline from './_components/ScanLine'
import Vignette from './_components/Vignette'
import GridBackground from './_components/GridBackground'
import TerminalDecorations from './_components/TerminalDecorations'

const appsAdmin = [
  {
    nombre: "ArceuSpeak",
    descripcion: "Enviar mensajes al chat",
    icono: <Terminal className="w-6 h-6" />,
    enlace: "/smartrotom/admin/arceuspeak",
    id: "app-01"
  },
  {
    nombre: "OGT Explorer",
    descripcion: "Generar carteles de autopista",
    icono: <Database className="w-6 h-6" />,
    enlace: "/smartrotom/admin/carteles",
    id: "app-02"
  },
  {
    nombre: "Rendimiento del Servidor",
    descripcion: "Monitor de rendimiento del servidor",
    icono: <AlertTriangle className="w-6 h-6" />,
    enlace: "/smartrotom/admin/rendimiento",
    id: "app-03"
  },
  {
    nombre: "Gestión de Apps",
    descripcion: "Gestión de aplicaciones del jugador",
    icono: <Shield className="w-6 h-6" />,
    enlace: "/smartrotom/admin/apps",
    id: "app-04"
  }
]

export default function PanelControlAdmin() {
  const [loaded, setLoaded] = useState(false);
  const [typing, setTyping] = useState(true);
  const [visibleApps, setVisibleApps] = useState<string[]>([]);
  const [stats, setStats] = useState({ cpu: 0, mem: 0, net: 0 });
  
  useEffect(() => {
    // Simulate terminal boot sequence
    const timer = setTimeout(() => {
      setLoaded(true);
      setTyping(false);
    }, 1000);
    
    // Simulate apps loading one by one
    appsAdmin.forEach((app, idx) => {
      setTimeout(() => {
        setVisibleApps(prev => [...prev, app.id]);
      }, 1500 + (idx * 200));
    });
    
    // Simulate system monitoring
    const statsInterval = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 100),
        mem: Math.floor(Math.random() * 100),
        net: Math.floor(Math.random() * 1000)
      });
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(statsInterval);
    };
  }, []);

  const ipAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const timestamp = new Date().toISOString();

  return (
    <div className="w-full min-h-screen bg-black text-highlight-400 font-mono p-4 overflow-hidden terminal-container relative">
      <pre className="text-xs sm:text-sm md:text-base text-center text-highlight-500 mb-4 overflow-x-auto">
        {`
         ______ _                _           _         
        |  ____(_)              | |         | |        
        | |__   _  ___ _   _ ___| |     __ _| |__  ___ 
        |  __| | |\/ __| | | / __| |    \/ _\` | '_ \\/ __|
        | |    | | (__| |_| \\__ \\ |___| (_| | |_) \\__ \\
        |_|    |_|\\___|\\__,_|___/______\\__,_|_.__/|___/`}
      </pre>
      
      {/* Terminal Window */}
      <div className="border border-highlight-700 rounded-md mb-6 p-4">
        <div className="bg-highlight-900/30 px-4 py-1 border-b border-highlight-700 flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-highlight-500"></div>
          </div>
          <div className="text-xs text-highlight-400">root@ficus-labs:~</div>
          <div className="text-xs text-highlight-400">{ipAddress}</div>
        </div>
        
        <div className="p-4 bg-black/90 text-sm terminal-content" style={{ fontFamily: 'monospace' }}>
          {!loaded ? (
            <>
              <p className="text-highlight-500">$ iniciando_sistema</p>
              <p className="text-highlight-300">Cargando módulos del núcleo... <span className="text-yellow-400">OK</span></p>
              <p className="text-highlight-300">Verificando integridad... <span className="text-yellow-400">OK</span></p>
              <p className="text-highlight-300">Estableciendo conexión segura... <span className="text-yellow-400">OK</span></p>
              <p className="text-highlight-300">Autenticando privilegios de administrador... <span className="text-yellow-400">OK</span></p>
              <p className="text-highlight-500 animate-pulse">Cargando interfaz de administración...</p>
            </>
          ) : (
            <h1 className="text-2xl font-bold mb-4 text-center text-highlight-500 uppercase tracking-widest glitch">
              Terminal de Acceso Restringido
            </h1>
          )}

          {typing && loaded && (
            <div className="typing-effect">
              <span className="text-highlight-400">$:</span> <span className="text-highlight-200">acceso_concedido</span>
              <span className="animate-blink text-highlight-400">▋</span>
            </div>
          )}
        </div>

      
      {/* Apps Grid */}
      {loaded && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {appsAdmin.map((app) => (
              <Link href={app.enlace} key={app.nombre} className={`block transition-opacity duration-500 ${visibleApps.includes(app.id) ? 'opacity-100' : 'opacity-0'}`}>
                <Card className="hover:shadow-neon bg-black border-highlight-500 border h-full relative transition-all duration-300 hover:scale-[1.01]">
                  <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10"></div>
                  <div className="absolute top-0 right-0 p-1 text-xs text-highlight-400">#{app.id}</div>
                  <CardHeader className="flex flex-row items-center space-x-4 px-3 py-3">
                    <div className="bg-highlight-900/40 rounded-sm p-2 text-highlight-400">
                      {app.icono}
                    </div>
                    <CardTitle className="text-highlight-400 font-bold text-base">
                      <span className="text-highlight-600 mr-2">&gt;</span>{app.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 py-2">
                    <CardDescription className="text-highlight-600/80 text-sm">
                      <span className="text-highlight-600/60">{"//"} </span>
                      {app.descripcion}
                    </CardDescription>
                    <div className="mt-3 text-xs text-highlight-700">
                      <div className="flex justify-between">
                        <span>STATUS:</span>
                        <span className="text-highlight-400">ONLINE</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PERMISOS:</span>
                        <span className="text-highlight-400">ROOT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* System Stats */}
          <div className="mt-8 border border-highlight-800/60 rounded bg-black/60 p-3">
            <div className="text-xs flex flex-col sm:flex-row justify-between mb-2">
              <p className="text-highlight-500/80"><span className="text-highlight-600">[SYS]</span> Acceso autorizado: {timestamp}</p>
              <p className="text-highlight-500/80 flex items-center">
                <span className="text-highlight-600">[SEC]</span> Nivel de seguridad: 
                <span className="text-yellow-400 ml-1 glitch-mini">MÁXIMO</span>
                <span className="w-2 h-2 bg-highlight-500 animate-pulse rounded-full ml-2"></span>
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="flex justify-between">
                  <span className="text-highlight-600">CPU:</span>
                  <span className={`${stats.cpu > 80 ? 'text-red-400' : 'text-highlight-400'}`}>{stats.cpu}%</span>
                </div>
                <div className="w-full bg-highlight-900/30 h-1 rounded">
                  <div className={`h-1 rounded ${stats.cpu > 80 ? 'bg-red-500' : 'bg-highlight-500'}`} style={{width: `${stats.cpu}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-highlight-600">MEM:</span>
                  <span className={`${stats.mem > 80 ? 'text-red-400' : 'text-highlight-400'}`}>{stats.mem}%</span>
                </div>
                <div className="w-full bg-highlight-900/30 h-1 rounded">
                  <div className={`h-1 rounded ${stats.mem > 80 ? 'bg-red-500' : 'bg-highlight-500'}`} style={{width: `${stats.mem}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-highlight-600">NET:</span>
                  <span className="text-highlight-400">{stats.net} KB/s</span>
                </div>
                <div className="w-full bg-highlight-900/30 h-1 rounded">
                  <div className="h-1 bg-highlight-500 rounded" style={{width: `${Math.min(stats.net/10, 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      </div>
      
      <TerminalDecorations />
    </div>
  )
}