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

const NOT_LINKED_SMARTROTOM = {
  message: "Usuario de SmartRotom no vinculado. Accede a Minecraft antes de usar la web.",
  help: {
    possibleCauses: [
      "No has iniciado sesión en Minecraft",
      "Los datos de sesión de Minecraft no son válidos",
    ],
    solutions: [
      "Inicia sesión en Minecraft primero",
      "Reinicia el cliente de Minecraft",
      "Contacta con soporte si el problema persiste",
    ],
  },
}

const NOT_LINKED_BOFFMEDIA = {
  message: "Usuario de BoffMedia no vinculado",
  help: {
    possibleCauses: [
      "No has vinculado tu cuenta de BoffMedia",
      "La conexión con BoffMedia ha fallado",
    ],
    solutions: [
      "Vincula tu cuenta de BoffMedia en la configuración",
      "Cierra sesión y vuelve a iniciarla",
    ],
  },
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

  // The theme lives in a persisted store, not local state — it used to reset on every
  // reload. `RotomNav`/`Settings` write to the same store, so no setter is threaded down.
  const tema = useRotomThemeClass()

  // Pre-authenticated screens (loading, auth, link errors) render OUTSIDE the
  // `h-screen` app shell below, as direct flex children of the `min-h-screen`
  // <body>. `min-h-screen` is not a definite height, so their `h-full` roots
  // (LoadingScreen, MinecraftAuthForm, RotomErrorPage…) collapse to content
  // height. This shell bounds them at the viewport so they fill it, and scrolls
  // if a tall form (register) exceeds it.
  const AuthScreen = ({ children }: { children: React.ReactNode }) => (
    <div className={`roboto h-screen w-full overflow-y-auto ${tema}`}>
      {children}
    </div>
  )

  /*
    if ('speechSynthesis' in window) {
      var msg = new SpeechSynthesisUtterance();
      var voices = window.speechSynthesis.getVoices();
      msg.voice = voices[10]; 
      msg.volume = 1; // From 0 to 1
      msg.rate = 1; // From 0.1 to 10
      msg.pitch = 2; // From 0 to 2
      msg.text = "Como estas Joel";
      msg.lang = 'es';
      speechSynthesis.speak(msg);
     }else{
       // Speech Synthesis Not Supported 😣
       alert("Sorry, your browser doesn't support text to speech!");
     }*/

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
            actionText="Cerrar sesión"
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
            Cerrar sesión
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
      // h-screen (not min-h-screen): the shell must BOUND the app, or per-app
      // scroll roots (e.g. Furret Today's `.ft-app` overflow-auto) stretch to
      // content height and can never scroll — and window scroll is dead anyway
      // because the overflow-hidden <main> stops wheel chaining.
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