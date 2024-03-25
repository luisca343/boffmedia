"use client"

import { signIn, signOut, useSession } from "next-auth/react";

export default function Settings({ setTema } : { setTema: (tema: string) => void}){
    const { data: session } = useSession();

    return (
        <div>
            <div className="flex flex-col p-2 bg-rotom-500 text-white ">
                <button onClick={() => setTema('')}  className="block w-full text-left">Tema 1</button>
               <button onClick={() => setTema('theme-dark')} className="block w-full text-left">Tema 2</button>
            </div>
            <button className="text-white mx-1 bg-black" onClick={() => signIn('boffmedia')}>Sign in</button>
            <button className="text-white mx-1 bg-black" onClick={() => signOut()}>Sign out</button>
            <h1>Settings</h1>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    );
}