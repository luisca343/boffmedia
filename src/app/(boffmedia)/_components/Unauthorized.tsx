"use client"

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import BoffLayout from "@/app/(boffmedia)/_components/layout/BoffLayout"

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
              variant="default"
              onClick={() => router.push('/')}
            >
              Volver al Inicio
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              Volver Atrás
            </Button>
          </div>
        </div>
      </div>
  )
}