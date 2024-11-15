"use client";
import { useSession } from "next-auth/react";
import RotomNav from "../nav/RotomNav";

import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

import { signIn } from "next-auth/react";
import { isMinecraft } from "@/services/mcef/mcefHelper";
import { useEffect, useState } from "react";
import AuthForm, { FormCenteredInPage } from "@/app/auth/AuthForm";
import { LoadingScreen } from "./Loading";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CallStatus } from "./CallStatus";
import { BoffSession } from "@/types";
import { getMcUserData } from "@/services/mcef/mcefApi";


export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession() as {
    data: BoffSession | null;
    status: string;
  };
  const [datosUsuario, setDatosUsuario] = useState<Object | null>(null);
  const [isMC, setIsMC] = useState(false);

  const [tema, setTema] = useState("");

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
    const isSmart = isMinecraft();
    setIsMC(isSmart);

    const fetchDatosUsuario = async () => {
      if (isSmart) {
        const { data, error } = await getMcUserData();
    
        if (error) {
          setDatosUsuario(null);
          return;
        }
    
        if (data) {
          const response = await signIn('minecraft', {
            redirect: false,
            username: data.username,
            uuid: data.uuid,
            world: data.world,
          });
    
          if (response?.error) {
            setDatosUsuario(null);
            return;
          }
    
          setDatosUsuario(data);
        }
      } else {
        setDatosUsuario(null);
      }
    };
    fetchDatosUsuario();
  }, []);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" && isMC) {
    if (!datosUsuario) return <LoadingScreen />;

    return <p>{Object.values(datosUsuario)}</p>;
  }

  if (status === "unauthenticated" && !isMC) {
    return <FormCenteredInPage url="boffmedia" redirect="/smartrotom" />;
  }

  function boffMediaLinked(): boolean {
    return session?.user.username ? true : false;
  }

  function smartRotomLinked(): boolean {
    return session?.user.smartRotomUser?.uuid ? true : false;
  }
  
  if (status === "authenticated" && !smartRotomLinked()) {
    if (!isMC)
      return <RotomErrorPage error="Usuario de SmartRotom no vinculado. Accede a Minecraft antes de usar la web." />;
    return <AuthForm url="smartrotom" redirect="/smartrotom" />;
  }

  if (status === "authenticated" && !boffMediaLinked()) {
    //return <RotomError error="Usuario de BoffMedia no vinculado"/>
  }

  return (
    <section
      id="smartrotom"
      className={`roboto flex flex-col h-screen overflow-hidden ${tema} text-black bg-transparent`}
    >
      <RotomNav setTema={setTema} />
      <ToastContainer position="bottom-right" theme="dark" />
      <main className="relative overflow-hidden border-solid no-scrollbar flex-1">
        <CallStatus />
        <div className="h-full w-full [&>*]:h-full [&>*]:overflow-auto">
          {children}
        </div>
      </main>
    </section>
  );
}

function RotomErrorPage({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-primary-400 text-primary-950 font-mono">
      <RotomError error={error} />
    </div>
  );
}

function RotomError({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary-200 p-8 rounded-lg shadow-lg border-2 border-primary-300"
    >
      <div className="flex items-center mb-4">
        <AlertTriangle className="w-8 h-8 text-primary-500 mr-2" />
        <h1 className="text-2xl font-bold">Error Detectado</h1>
      </div>
      <div className="bg-primary-300 p-4 rounded">
        <p className="text-sm">{error}</p>
      </div>
      <div className="mt-6 text-center">
        <p className="text-xs text-primary-700">
          SmartRotom Error Code: <span className="font-bold">SR-001</span>
        </p>
      </div>
    </motion.div>
  );
}
