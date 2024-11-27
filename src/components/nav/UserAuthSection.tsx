'use client'

import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { LogOut, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBoffSession } from "@/services/useBoffSession"
import { signOut } from "next-auth/react"
import { InternalLink } from './Link'
import Link from 'next/link'

export default function UserAuthSection() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { session } = useBoffSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  if (session) {
    return (
      <>
        <Link className="text-primary-300" href='/perfil'>
          {session.user.username || session.user.smartRotomUser.username}
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-primary-300 hover:text-primary-200 hover:bg-surface-800 transition-colors duration-200"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Cerrar sesión
        </Button>
      </>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push("/api/auth/signin")}
        className="text-primary-300 hover:text-primary-200 hover:bg-surface-800 transition-colors duration-200"
      >
        <LogIn className="h-5 w-5 mr-2" />
        Iniciar sesión
      </Button>
      <Button
        variant="ghost"
        onClick={() => router.push("/auth?mode=register")}
        className="text-primary-300 hover:text-primary-200 hover:bg-surface-800 transition-colors duration-200"
      >
        <UserPlus className="h-5 w-5 mr-2" />
        Registrarse
      </Button>
    </>
  )
}