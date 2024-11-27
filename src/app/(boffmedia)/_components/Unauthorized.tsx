"use client"

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
      <div className="flex items-center justify-center">
        <div className="text-center p-8 bg-surface-800 rounded-lg shadow-xl max-w-md w-full">
          <AlertTriangle className="mx-auto h-16 w-16 text-primary-500 mb-6" />
          <h1 className="text-3xl font-bold text-primary-300 mb-4">Acceso No Autorizado</h1>
          <p className="text-surface-300 mb-6">
            Lo sentimos, no tienes permiso para acceder a esta página. Si crees que esto es un error, por favor contacta al administrador.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white transition-colors duration-200"
            >
              Volver al Inicio
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full border-primary-500 text-primary-300 hover:bg-primary-500 hover:text-white transition-colors duration-200"
            >
              Volver Atrás
            </Button>
          </div>
        </div>
      </div>
  )
}