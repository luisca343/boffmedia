"use client"
import { useSession } from "next-auth/react";

export default function SessionTest() {
    const { data: session } = useSession();
    return(
        <div>
            <h1>Session Test</h1>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    )
}