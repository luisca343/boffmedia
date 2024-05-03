"use client"

import { strToDate } from "@/lib/utils"
import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function DocumentsList() {
    const {data: session} = useSession() as any
    const [documents, setDocuments] = useState([])
    const router = useRouter()

    useEffect(() => {
        const result = rotomGET(`/documents/all/${session?.user.smartRotomUser?.uuid}`)
            .then((res) => {
                setDocuments(res)
            }
        )
    }, [session])

    function createNote() {
        rotomPOST(`/documents/create`, {title: "New Note", content: "", type: 0, userUuid: session?.user.smartRotomUser?.uuid})
            .then((res) => {
                if(res.id){
                    router.push(`/smartrotom/notas/${res.id}`)
                }
            }
        )
    }

    return (
        <div className="bg-main-800  ">
            <div className="flex flex-wrap justify-start">
                    <button onClick={() => createNote()} className="text-white bg-main-700 p-2 rounded-lg m-2 hover:bg-main-500 w-[300px] text-center flex flex-col justify-center items-center">
                        <h2>Crear</h2>
                    </button>
                    {documents.length > 0 ? 
                    documents.map((doc: any) => {
                        return (
                            <Link key={doc.uuid} href={`/smartrotom/notas/${doc.id}`}>
                                <div className="text-white bg-main-700 p-2 rounded-lg m-2 hover:bg-main-500 w-[300px] text-center">
                                    <h2>{doc.title}</h2>
                                    <div>{strToDate(doc.updatedAt)}</div>
                                </div>
                            </Link>
                        )
                    }) : <p className="text-white">No documents found</p>    
                }
            </div>
        </div>
    )
}   