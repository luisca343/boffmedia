'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { toast } from 'react-toastify';

export function MovingSection() {
  //const serverIP = 'wingull.boffmedia.es'
  const serverIP = 'IP no disponible'
  const [isCopied, setIsCopied] = useState(false)
  

  const handleConnect = () => {
    navigator.clipboard.writeText(serverIP).then(() => {
      setIsCopied(true)
      toast.success("IP del servidor copiada. La IP del servidor ha sido copiada al portapapeles.")
      setTimeout(() => setIsCopied(false), 2000)
    }).catch(err => {
      console.error('Error al copiar: ', err)
      toast.error("Error. No se pudo copiar la IP del servidor. Por favor, inténtalo de nuevo.")
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="text-center"
    >
      <h2 className="text-3xl font-bold mb-6">¡Únete a la Aventura Hoy!</h2>
      <Button 
        onClick={handleConnect}
        className="bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-lg px-8 py-3 rounded-full"
      >
        {isCopied ? 'IP Copiada!' : 'Conectar al Servidor'}
      </Button>
      <p className="mt-4 text-sm">Haz clic para copiar la IP del servidor: {serverIP}</p>
    </motion.div>
  )
}