import { useCreateNote } from "@/hooks/documents/useCreateNote";
import { useGetNotes } from "@/hooks/documents/useGetNotes";
import { useBoffSession } from "@/services/useBoffSession";
import { CreateDocumentDtoWithUuid } from "@boffmedia/shared";
import { useState } from "react"

export function useGetDocuments() {
    const { session } = useBoffSession();
    const {notes, setNotes, refetch } = useGetNotes(session?.user.smartRotomUser?.uuid as string);
    const { createNote } = useCreateNote();
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>("")

    function newNote() {
        createNote({title: "New Note", content: " ", type: 0, uuid: session?.user.smartRotomUser?.uuid} as CreateDocumentDtoWithUuid).then((res: any) => {
            if(res.data.id){
                refetch()
                setSelectedNoteId(res.data.id)
            }
        })
    }

    return { notes, setNotes, newNote, fetchDocuments: refetch, selectedNoteId, setSelectedNoteId } as {
        notes: any[];
        setNotes: (documents: any[]) => void;
        newNote: (noteData: any) => void;
        fetchDocuments: () => void;
        selectedNoteId: string;
        setSelectedNoteId: (id: string) => void;
    }
}