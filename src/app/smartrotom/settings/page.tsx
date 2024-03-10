"use client"

import { signIn, signOut, useSession } from "next-auth/react";

export default function Ajustes() {
    const { data: session } = useSession();

    return (
        <div>
            <button className="text-white mx-1 bg-black" onClick={() => signIn('boffmedia')}>Sign in</button>
            <button className="text-white mx-1 bg-black" onClick={() => signOut()}>Sign out</button>
            <h1>Ajustes</h1>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    );
}