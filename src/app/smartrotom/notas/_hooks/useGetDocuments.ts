import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useGetDocuments(){
    const { session } = useBoffSession();
    const [documents, setDocuments] = useState<Document[]>([])
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>("")
    const router = useRouter()

    useEffect(() => {
        fetchDocuments();
    }, [session])

    function fetchDocuments() {
        rotomGET(`/documents/all/${session?.user.smartRotomUser?.uuid}`)
            .then((res) => {
                setDocuments(res)
            }
        )
    }

    function createNote() {
        rotomPOST(`/documents/create`, {title: "New Note", content: "", type: 0, uuid: session?.user.smartRotomUser?.uuid})
            .then((res) => {
                if(res.id){
                    fetchDocuments()
                    setSelectedNoteId(res.id)
                }
            }
        )
    }

    return { documents, setDocuments, createNote, fetchDocuments, selectedNoteId, setSelectedNoteId } as {
        documents: Document[];
        setDocuments: (documents: Document[]) => void;
        createNote: () => void;
        fetchDocuments: () => void;
        selectedNoteId: string;
        setSelectedNoteId: (id: string) => void;
    }
}