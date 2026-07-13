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
import { RotomError, RotomErrorPage } from "./RotomError"
import { RotomErrorCodeKey } from "./RotomErrorSystem"
import { useRotomThemeClass } from "./theme/useRotomTheme"

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
    return <LoadingScreen />
  }

  if (status === "unauthenticated" && isMC) {
    return <MinecraftAuthForm mcUserData={datosUsuario} />
  }

  if (status === "unauthenticated" && !isMC) {
    return <AuthForm url="boffmedia" redirect="/smartrotom" />
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
        <RotomErrorPage 
          errorCode={"SMARTROTOM_NOT_LINKED" as RotomErrorCodeKey}
          context={{ 
            userId: session?.user?.id,
            hasMinecraft: isMC
          }}
          onAction={() => signOut({ callbackUrl: "/" })} 
          actionText="Cerrar sesión"
          showHelp={true}
        />
      )
    return <div>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Cerrar sesión
      </button>
    </div>
  }

  if (status === "authenticated" && !boffMediaLinked()) {
    return (
      <RotomError 
        errorCode={"BOFFMEDIA_NOT_LINKED" as RotomErrorCodeKey}
        context={{ userId: session?.user?.id }}
        showHelp={true}
      />
    )
  }

  return (
    <section
      id="smartrotom"
      className={`roboto flex flex-col min-h-screen ${tema} text-black bg-transparent`}
    >
      <RotomNav />
      <ToastContainer position="bottom-right" theme="dark" />
      <main className="relative flex-1 pt-12 flex overflow-hidden">
        <CallStatus />
        <div className="h-full w-full [&>*]:w-full flex overflow-hidden">{children}</div>
      </main>
    </section>
  )
}