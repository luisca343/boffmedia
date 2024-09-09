import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useDocuments(){
    const {data: session} = useSession() as any
    const [documents, setDocuments] = useState<Document[]>([])
    const router = useRouter()

    useEffect(() => {
        rotomGET(`/documents/all/${session?.user.smartRotomUser?.uuid}`)
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

    return { documents, setDocuments, createNote }
}