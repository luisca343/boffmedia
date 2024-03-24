"use client"

import { BoffSession } from "@/components/smartrotom/AppWrapper"
import { useSession } from "next-auth/react"
import MenuWrapper from "../_components/MenuWrapper"

export default function Reclamar(){
    const {data: session} = useSession() as {data: BoffSession | null}
    return(
        <MenuWrapper>
            <h1>Reclamar</h1>
        </MenuWrapper>
    )
}