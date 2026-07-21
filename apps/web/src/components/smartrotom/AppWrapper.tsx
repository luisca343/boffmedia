"use client"
import type { Session } from "next-auth"
import { RotomNav } from "./RotomNav"
import { signIn, signOut } from "next-auth/react"
import { LoadingScreen } from "./Loading"
import { CallStatus } from "./calls/CallStatus"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRotomUuid } from "./behavior/useRotomUuid"
import { AuthForm } from "@/app/auth/AuthForm"
import "react-toastify/dist/ReactToastify.css"
import { ToastContainer } from "react-toastify"
import { getMcUserData } from "@/services/mcef/mcefApi"
import { isMinecraft } from "@/services/mcef/mcefHelper"
import { MinecraftAuthForm } from "./MinecraftAuthForm"
import { RotomErrorPage } from "./RotomError"
import { useRotomThemeClass } from "./theme/useRotomTheme"
import { useTranslations } from "next-intl"

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession() as {
    data: Session
    status: string
  }
  const rotomUuid = useRotomUuid()
  const [datosUsuario, setDatosUsuario] = useState<Object | null>(null)
  const [isMC, setIsMC] = useState(false)
  const t = useTranslations("smartrotom")

  const tema = useRotomThemeClass()

  const NOT_LINKED_SMARTROTOM = {
    message: t("notLinked.smartrotomMessage"),
    help: {
      possibleCauses: [
        t("notLinked.smartrotomCauses.0"),
        t("notLinked.smartrotomCauses.1"),
      ],
      solutions: [
        t("notLinked.smartrotomSolutions.0"),
        t("notLinked.smartrotomSolutions.1"),
        t("notLinked.smartrotomSolutions.2"),
      ],
    },
  }

  const NOT_LINKED_BOFFMEDIA = {
    message: t("notLinked.boffmediaMessage"),
    help: {
      possibleCauses: [
        t("notLinked.boffmediaCauses.0"),
        t("notLinked.boffmediaCauses.1"),
      ],
      solutions: [
        t("notLinked.boffmediaSolutions.0"),
        t("notLinked.boffmediaSolutions.1"),
      ],
    },
  }

  const AuthScreen = ({ children }: { children: React.ReactNode }) => (
    <div className={`roboto h-screen w-full overflow-y-auto ${tema}`}>
      {children}
    </div>
  )

  useEffect(() => {
    const isSmart = isMinecraft()
    
    setIsMC(isSmart)

    const fetchDatosUsuario = async () => {
      if (isSmart) {
        const { data, error } = await getMcUserData()

        if (error) {
          setDatosUsuario(null)
          return
        }

        if (data) {
          const response = await signIn("minecraft", {
            redirect: false,
            username: data.username,
            uuid: data.uuid,
            world: data.world,
          })

          setDatosUsuario(data)
        }
      } else {
        setDatosUsuario(null)
      }
    }
    fetchDatosUsuario()
  }, [])

  if (status === "loading") {
    return (
      <AuthScreen>
        <LoadingScreen />
      </AuthScreen>
    )
  }

  if (status === "unauthenticated" && isMC) {
    return (
      <AuthScreen>
        <MinecraftAuthForm mcUserData={datosUsuario} />
      </AuthScreen>
    )
  }

  if (status === "unauthenticated" && !isMC) {
    return (
      <AuthScreen>
        <AuthForm url="boffmedia" redirect="/smartrotom" />
      </AuthScreen>
    )
  }

  function boffMediaLinked(): boolean {
    return session?.user.name ? true : false
  }

  function smartRotomLinked(): boolean {
    return rotomUuid ? true : false
  }

  if (status === "authenticated" && !smartRotomLinked()) {
    if (!isMC)
      return (
        <AuthScreen>
          <RotomErrorPage
            error={NOT_LINKED_SMARTROTOM.message}
            help={NOT_LINKED_SMARTROTOM.help}
            onAction={() => signOut({ callbackUrl: "/" })}
            actionText={t("settings.signOut")}
            showHelp={true}
          />
        </AuthScreen>
      )
    return (
      <AuthScreen>
        <div className="flex h-full items-center justify-center">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {t("settings.signOut")}
          </button>
        </div>
      </AuthScreen>
    )
  }

  if (status === "authenticated" && !boffMediaLinked()) {
    return (
      <AuthScreen>
        <RotomErrorPage
          error={NOT_LINKED_BOFFMEDIA.message}
          help={NOT_LINKED_BOFFMEDIA.help}
          showHelp={true}
        />
      </AuthScreen>
    )
  }

  return (
    <section
      id="smartrotom"
      className={`roboto flex h-screen flex-col ${tema} text-black bg-transparent`}
    >
      <RotomNav />
      <ToastContainer position="bottom-right" theme="dark" />
      <main className="relative flex-1 min-h-0 pt-12 flex overflow-hidden">
        <CallStatus />
        <div className="h-full w-full [&>*]:w-full flex overflow-hidden">{children}</div>
      </main>
    </section>
  )
}
