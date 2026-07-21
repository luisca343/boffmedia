"use client"
import { useState } from "react"
import { signIn, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { AlertTriangle, User, UserPlus, Link } from "lucide-react"
import { toast } from "react-toastify"
import { boffPOST } from "@/services/boffAPI"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("smartrotom.auth")

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
            toast.error(response.error || t("linkError"))
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
          toast.error(t("minecraftLinkError"))
          setIsLoading(false)
          return
        }
      }

      toast.success(t("linkSuccess"))
    } catch (error) {
      toast.error(t("linkError"))
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("passwordMismatch"))
      return
    }

    setIsLoading(true)

    try {
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
        toast.error(response.error || t("createError"))
        setIsLoading(false)
        return
      }

      const signInResult = await signIn("boffmedia", {
        redirect: false,
        username: formData.username,
        password: formData.password,
      })

      if (signInResult?.error) {
        toast.error(t("loginNewError"))
        setIsLoading(false)
        return
      }

      toast.success(t("createSuccess"))
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(t("createError"))
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (mode === 'choice') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-primary-hover text-primary-active font-mono">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary-soft p-8 rounded-lg shadow-lg border-2 border-primary max-w-md w-full"
        >
          <div className="flex items-center mb-6">
            <Link className="w-8 h-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">{t("linkAccount")}</h1>
          </div>
          
          <div className="bg-primary-soft p-4 rounded mb-6">
            <p className="text-sm mb-2">
              {t("minecraftUser")} <span className="font-bold">{mcUserData?.username}</span>
            </p>
            <p className="text-xs text-primary-active">
              {t("linkPrompt")}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('login')}
              className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-active text-white p-3 rounded transition-colors"
            >
              <User className="w-5 h-5" />
              <span>{t("hasAccount")}</span>
            </button>
            
            <button
              onClick={() => setMode('register')}
              className="w-full flex items-center justify-center space-x-2 bg-primary-active hover:bg-primary-active text-white p-3 rounded transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>{t("createAccount")}</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: '/smartrotom' })}
                className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white p-3 rounded transition-colors"
            >
                <AlertTriangle className="w-5 h-5" />
                <span>{t("cancelLink")}</span>
            </button>
              
          </div>
        </motion.div>
      </div>
    )
  }

  if (mode === 'login') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-primary-hover text-primary-active font-mono">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary-soft p-8 rounded-lg shadow-lg border-2 border-primary max-w-md w-full"
        >
          <div className="flex items-center mb-6">
            <User className="w-8 h-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">{t("linkExisting")}</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("username")}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("password")}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="flex-1 bg-layer-3 hover:bg-layer-3 text-white p-2 rounded transition-colors"
                disabled={isLoading}
              >
                {t("back")}
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-active text-white p-2 rounded transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? t("linking") : t("link")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  if (mode === 'register') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-primary-hover text-primary-active font-mono">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary-soft p-8 rounded-lg shadow-lg border-2 border-primary max-w-md w-full"
        >
          <div className="flex items-center mb-6">
            <UserPlus className="w-8 h-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">{t("createNew")}</h1>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("username")}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("email")}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("password")}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("confirmPassword")}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full p-2 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="flex-1 bg-layer-3 hover:bg-layer-3 text-white p-2 rounded transition-colors"
                disabled={isLoading}
              >
                {t("back")}
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-active text-white p-2 rounded transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? t("creating") : t("create")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  return null
}
