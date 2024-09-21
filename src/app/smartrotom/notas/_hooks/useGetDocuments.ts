import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useGetDocuments(){
    const { session } = useBoffSession();
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