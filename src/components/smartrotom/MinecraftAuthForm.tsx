"use client"
import { useState } from "react"
import { signIn, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { AlertTriangle, User, UserPlus, Link } from "lucide-react"
import { toast } from "react-toastify"
import { boffPOST } from "@/services/boffAPI"

interface MinecraftAuthFormProps {
  mcUserData: any
}

export function MinecraftAuthForm({ mcUserData }: MinecraftAuthFormProps) {
  const [mode, setMode] = useState<'choice' | 'login' | 'register'>('choice')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mcUserData) {
      const response = await boffPOST('/auth/link-minecraft', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        minecraft: {
          username: mcUserData?.username,
          uuid: mcUserData?.uuid,
          world: mcUserData?.world
        }
      })
      
      alert("Response: " + JSON.stringify(response))

        if (response?.error) {
            toast.error(response.error || "Error al vincular cuenta")
            setIsLoading(false)
            return
        }

        const mcResult = await signIn("minecraft", {
          redirect: false,
          username: mcUserData.username,
          uuid: mcUserData.uuid,
          world: mcUserData.world,
        })

        if (mcResult?.error) {
          toast.error("Error al vincular cuenta de Minecraft")
          setIsLoading(false)
          return
        }
      }

      toast.success("Cuenta vinculada exitosamente")
      // The page will refresh automatically when authentication state changes
    } catch (error) {
      toast.error("Error al vincular cuenta")
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      // Create new BoffMedia account with Minecraft data using boffPOST
      const response = await boffPOST('/auth/register-minecraft', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        minecraft: {
          username: mcUserData?.username,
          uuid: mcUserData?.uuid,
          world: mcUserData?.world
        }
      })

      if (response?.error) {
        toast.error(response.error || "Error al crear cuenta")
        setIsLoading(false)
        return
      }

      // After successful registration, sign in with the new credentials
      const signInResult = await signIn("boffmedia", {
        redirect: false,
        username: formData.username,
        password: formData.password,
      })

      if (signInResult?.error) {
        toast.error("Error al iniciar sesión con la nueva cuenta")
        setIsLoading(false)
        return
      }

      toast.success("Cuenta creada y vinculada exitosamente")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Error al crear cuenta")
      setIsLoading(false)
    }
  }

  // ...rest of the component remains the same...
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (mode === 'choice') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-primary-400 text-primary-950 font-mono">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary-200 p-8 rounded-lg shadow-lg border-2 border-primary-300 max-w-md w-full"
        >
          <div className="flex items-center mb-6">
            <Link className="w-8 h-8 text-primary-500 mr-2" />
            <h1 className="text-2xl font-bold">Vincular Cuenta</h1>
          </div>
          
          <div className="bg-primary-300 p-4 rounded mb-6">
            <p className="text-sm mb-2">
              Usuario de Minecraft: <span className="font-bold">{mcUserData?.username}</span>
            </p>
            <p className="text-xs text-primary-700">
              Para continuar, necesitas vincular tu cuenta de BoffMedia
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('login')}
              className="w-full flex items-center justify-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white p-3 rounded transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Tengo una cuenta de BoffMedia</span>
            </button>
            
            <button
              onClick={() => setMode('register')}
              className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Crear nueva cuenta</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: '/smartrotom' })}
                className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white p-3 rounded transition-colors"
            >
                <AlertTriangle className="w-5 h-5" />
                <span>Cancelar Vinculación</span>
            </button>
              
          </div>
        </motion.div>
      </div>
    )
  }

  if (mode === 'login') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-primary-400 text-primary-950 font-mono">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary-200 p-8 rounded-lg shadow-lg border-2 border-primary-300 max-w-md w-full"
        >
          <div className="flex items-center mb-6">
            <User className="w-8 h-8 text-primary-500 mr-2" />
            <h1 className="text-2xl font-bold">Vincular Cuenta Existente</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Usuario</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                disabled={isLoading}
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  if (mode === 'register') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-primary-400 text-primary-950 font-mono">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary-200 p-8 rounded-lg shadow-lg border-2 border-primary-300 max-w-md w-full"
        >
          <div className="flex items-center mb-6">
            <UserPlus className="w-8 h-8 text-primary-500 mr-2" />
            <h1 className="text-2xl font-bold">Crear Nueva Cuenta</h1>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Usuario</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                disabled={isLoading}
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Creando...' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  return null
}