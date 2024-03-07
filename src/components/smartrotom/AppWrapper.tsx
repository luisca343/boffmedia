"use client"
import { useSession } from "next-auth/react";
import RotomNav from "../nav/RotomNav";

import { signIn } from "next-auth/react";
import { getDatosUsuario, isMinecraft } from "@/services/mcefHelper";
import { useEffect, useState } from "react";

import { rotomPOST } from "@/services/boffAPI";
import { AxiosResponse } from "axios";

export default function AppWrapper({children} : {children: React.ReactNode}) {
    const { data: session, status } = useSession()
    const [datosUsuario, setDatosUsuario] = useState<Object | null>(null);

    useEffect(() => {
      const fetchDatosUsuario = async () => {
        if (typeof window !== 'undefined') {
            const data = await getDatosUsuario() as Object;
            setDatosUsuario(data);
        }
      };
      fetchDatosUsuario();
    }, []);
    
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
      }, [status, datosUsuario]);

      /*
      if (status === "loading") {
        return <p>Loading...</p>
      }
      
      if (status === "unauthenticated" && isMinecraft()) {
        if(!datosUsuario) return <p>Loading...</p>
        
        return <p>{Object.values(datosUsuario)}</p>
      }
      
      if (status === "unauthenticated" && !isMinecraft()) {
        return <LoginForm />
      }*/


    return (
        <section className={`roboto flex flex-col h-screen overflow-hidden `}>
            <RotomNav />
            <div className="overflow-auto border-solid no-scrollbar flex-1">
                {children}
            </div>
        </section>
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