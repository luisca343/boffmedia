'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/primitives/button"
import { toast } from 'react-toastify';
import { Copy, Server, Users, Zap } from 'lucide-react'

export function MovingSection() {
  //const serverIP = 'wingull.boffmedia.es'
  const serverIP = 'IP no disponible'
  const [isCopied, setIsCopied] = useState(false)
  

  const handleConnect = () => {
    navigator.clipboard.writeText(serverIP).then(() => {
      setIsCopied(true)
      toast.success("IP del servidor copiada al portapapeles.")
      setTimeout(() => setIsCopied(false), 3000)
    }).catch(err => {
      console.error('Error al copiar: ', err)
      toast.error("No se pudo copiar la IP del servidor.")
    })
  }

  return (
    <div className="text-center text-shadow-border1">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white drop-shadow-lg">
          ¡Únete a la Aventura Hoy!
        </h2>
        
        <div className="relative bg-secondary-900/60 backdrop-blur-sm border border-yellow-400/50 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Server className="h-5 w-5 text-yellow-400" />
            <span className="text-lg font-semibold text-yellow-300">Servidor Pixelmon Wingull</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <code className="bg-black/30 px-4 py-2 rounded-lg text-yellow-300 font-mono text-lg border border-yellow-400/30">
              {serverIP}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnect}
              className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 bg-transparent"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleConnect}
            className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {isCopied ? (
              <>
                <Zap className="mr-2 h-5 w-5" />
                ¡IP Copiada!
              </>
            ) : (
              <>
                <Users className="mr-2 h-5 w-5" />
                Conectar al Servidor
              </>
            )}
          </Button>
        </div>
        
        <p className="text-secondary-200 text-sm opacity-80">
          Haz clic en el botón para copiar la IP del servidor a tu portapapeles
        </p>
      </div>
    </div>
  )
}