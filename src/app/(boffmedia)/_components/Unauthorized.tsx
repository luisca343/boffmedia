"use client"

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <BoffLayout>
      <div className="flex items-center justify-center">
        <div className="text-center p-8 bg-surface-3 rounded-lg shadow-xl max-w-md w-full">
          <AlertTriangle className="mx-auto h-16 w-16 text-primary-light0 mb-6" />
          <h1 className="text-3xl font-bold text-primary mb-4">Acceso No Autorizado</h1>
          <p className="text-text-secondary mb-6">
            Lo sentimos, no tienes permiso para acceder a esta página. Si crees que esto es un error, por favor contacta al administrador.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-primary-light hover:bg-primary-hover text-white transition-colors duration-200"
            >
              Volver al Inicio
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full border-primary-light0 text-primary hover:bg-primary-light hover:text-white transition-colors duration-200"
            >
              Volver Atrás
            </Button>
          </div>
        </div>
      </div>
    </BoffLayout>
  )
}