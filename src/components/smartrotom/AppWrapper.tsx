"use client"
import { useSession } from "next-auth/react";
import RotomNav from "../nav/RotomNav";

import { signIn } from "next-auth/react";
import { getDatosUsuarioMC, isMinecraft } from "@/services/mcefHelper";
import { useEffect, useState } from "react";
import AuthForm from "@/app/auth/AuthForm";
import { Loading } from "./Loading";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const [tema, setTema] = useState('');

    useEffect(() => {
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
    
    /*
    useEffect(() => {
        if (status === "unauthenticated" && isMinecraft() && datosUsuario) {
          rotomPOST('/users/findUser', datosUsuario).then((res: AxiosResponse) => {
                if(res.status === 200) {
                    alert(status)
                }
                if(res.status === 201) {
                    alert('Usuario creado')
                }
                if(res.status === 500) {
                    alert('Error')
                }

          });
        }
      }, [status, datosUsuario]);*/

      
      if (status === "loading") {
        return <Loading />
      }
      
      if (status === "unauthenticated" && isMinecraft()) {
        if(!datosUsuario) return <Loading />
        
        return <p>{Object.values(datosUsuario)}</p>
      }
      
      if (status === "unauthenticated" && !isMinecraft()) {
        return <AuthForm url="boffmedia" redirect="/smartrotom"/>
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
        <section id="smartrotom" className={`roboto flex flex-col h-screen overflow-hidden ${tema}`}>
            <RotomNav setTema={setTema}/>
            <ToastContainer position="bottom-right" theme="dark"/>
            <div className="overflow-hidden border-solid no-scrollbar flex-1  [&>*]:h-full [&>*]:overflow-auto">
                {children}
            </div>
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

function LoginForm(){
    return (
        <div className="flex flex-col items-center justify-center h-full"
        >

            {isMinecraft() && <h1>MINECRAFT</h1>}
            <button  onClick={() => signIn('google')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >Sign in with Google</button>
        </div>
    )
}