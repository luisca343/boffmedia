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
import { getMcUserData, joinMinecraftServer } from "@/services/mcef/mcefApi"
import { AuthService } from "@/services/api/boffmedia/authService"
import { isMinecraft } from "@/services/mcef/mcefHelper"
import { MinecraftAuthForm } from "./MinecraftAuthForm"
import { RotomErrorPage } from "./RotomError"
import { useRotomThemeClass } from "./theme/useRotomTheme"
import { useTranslations } from "next-intl"

/**
 * Runs the Mojang identity handshake and returns the `serverId` the sign-in
 * trades for a session, or `null` when it could not complete.
 *
 * 1. the API issues a serverId (60s, single use)
 * 2. the mod joins Mojang with the running game's own access token
 * 3. the sign-in trades the serverId for a session the API verified via hasJoined
 *
 * `null` now means no sign-in, where it used to mean "fall back to the `world`
 * string". That fallback existed for jars predating the `MC_JOIN_SERVER` query;
 * 1.16.5 is deprecated, so failing here is a real failure — a jar that cannot
 * prove its identity is one we no longer serve, rather than one we trust on its
 * word.
 */
async function mcJoinServerId(username: string): Promise<string | null> {
  try {
    const challenge = await AuthService.minecraftChallenge()
    const serverId = challenge.data?.serverId
    if (!serverId) return null

    const join = await joinMinecraftServer(serverId)
    if (join.error || !join.data?.ok) {
      console.warn("Minecraft handshake failed:", join.error)
      return null
    }
    // The mod answers with the profile it actually joined as. If that is not who
    // the page thinks it is, the API would refuse anyway (hasJoined is keyed on
    // the username) — bail early rather than burn the challenge.
    if (join.data.username !== username) return null

    return serverId
  } catch (error) {
    console.warn("Minecraft handshake failed:", error)
    return null
  }
}

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
          // No serverId, no session: the handshake is the only credential now,
          // so there is nothing to attempt a sign-in with. Showing the player
          // the signed-out phone beats sending a request that cannot succeed.
          const serverId = await mcJoinServerId(data.username)
          if (!serverId) {
            setDatosUsuario(null)
            return
          }

          await signIn("minecraft", {
            redirect: false,
            username: data.username,
            uuid: data.uuid,
            world: data.world,
            serverId,
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
