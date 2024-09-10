"use client"
import { useSession } from "next-auth/react";
import RotomNav from "../nav/RotomNav";

import { signIn } from "next-auth/react";
import { getDatosUsuarioMC, isMinecraft } from "@/services/mcefHelper";
import { useEffect, useState } from "react";
import AuthForm, { FormCenteredInPage } from "@/app/auth/AuthForm";
import {  LoadingScreen } from "./Loading";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CallStatus } from "./CallStatus";

export type BoffSession = {
    user: {
        username: string | null;
        email: string | null;
        smartRotomUser: {
          username: string;
          uuid: string;
        }
    }
}

export default function AppWrapper({children} : {children: React.ReactNode}) {
    const { data: session, status } = useSession() as {data: BoffSession | null, status: string};
    const [datosUsuario, setDatosUsuario] = useState<Object | null>(null);
    const [isMC, setIsMC] = useState(false);

    const [tema, setTema] = useState('');

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
      isMinecraft().then((res) => {
        setIsMC(res);
      });

      const fetchDatosUsuario = async () => {
        if (typeof window !== 'undefined') {
            const data = await getDatosUsuarioMC() as {username: string, uuid: string, world: string};

            const response = await signIn('minecraft', {
              redirect: false,
              username: data.username,
              uuid: data.uuid,
              world: data.world
            });
            if(response?.error) {
              setDatosUsuario(null);
              return
            }

        } else {
            console.log('No window')
            setDatosUsuario(null);
        }
      };
      fetchDatosUsuario();
    }, []);

      if (status === "loading") {
        return <LoadingScreen />
      }
      
      if (status === "unauthenticated" && isMC) {
        if(!datosUsuario) return <LoadingScreen />
        
        return <p>{Object.values(datosUsuario)}</p>
      }
      
      if (status === "unauthenticated" && !isMC) {
        return <FormCenteredInPage url="boffmedia" redirect="/smartrotom"/>
      }

      function boffMediaLinked() {
        return session?.user.username;
      }

      function smartRotomLinked() {
        return session?.user.smartRotomUser?.uuid;
      }

      if(status === "authenticated" && !smartRotomLinked() ) {
        if(!isMinecraft())return <RotomError error="Usuario de SmartRotom no vinculado"/>
        return <AuthForm url="smartrotom" redirect="/smartrotom"/>
      }

      if(status === "authenticated" && !boffMediaLinked()) {
        //return <RotomError error="Usuario de BoffMedia no vinculado"/>
      }
      

    return (
        <section id="smartrotom" className={`roboto flex flex-col h-screen overflow-hidden ${tema} text-black`}>
            <RotomNav setTema={setTema}/>
            <ToastContainer position="bottom-right" theme="dark"/>
            <main className="relative overflow-hidden border-solid no-scrollbar flex-1">
              
                <CallStatus />
                <div className="h-full w-full [&>*]:h-full [&>*]:overflow-auto">{children}</div>
            </main>
        </section>
    )
}

function RotomError({error}: {error: string}) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-primary-400 text-primary-950 font-bold">
            <h1>Error</h1>
            <p>{error}</p>
        </div>
    )
}