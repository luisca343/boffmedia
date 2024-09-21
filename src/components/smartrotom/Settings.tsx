
"use client"
import { useBoffSession } from "@/services/useBoffSession";
import { signIn, signOut } from "next-auth/react";

export function SettingsPage({ setTema } : { setTema: (tema: string) => void}){
    const { session } = useBoffSession();

    return (
        <div>
            <div className="flex flex-col p-2 bg-primary-500 text-main-50 ">
                <button onClick={() => setTema('')}  className="block w-full text-left">Tema 1</button>
               <button onClick={() => setTema('theme-light')} className="block w-full text-left">Tema 2</button>
            </div>
            <button className="text-main-50 mx-1 bg-black" onClick={() => signIn('boffmedia')}>Sign in</button>
            <button className="text-main-50 mx-1 bg-black" onClick={() => signOut()}>Sign out</button>
            <h1>Settings</h1>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    );
}