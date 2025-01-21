import { useCreateNote } from "@/hooks/documents/useCreateNote";
import { useGetNotes } from "@/hooks/documents/useGetNotes";
import { useBoffSession } from "@/services/useBoffSession";
import { Note, NoteBase } from "@/types/documents";
import { CreateDocumentDtoWithUuid } from "@/types/dto/create-document.dto";
import { useState } from "react"

export function useGetDocuments(){
    const { session } = useBoffSession();
    const {notes, setNotes, refetch } = useGetNotes('67d9b543-5ac9-41e1-a8a5-20d7689e24a4');
    const { createNote } = useCreateNote();
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>("")

    function newNote() {
        createNote({title: "New Note", content: "", type: 0, uuid: session?.user.smartRotomUser?.uuid} as CreateDocumentDtoWithUuid).then((res: any) => {
            if(res.data.id){
                refetch()
                setSelectedNoteId(res.data.id)
            }
        })
    }

    return { notes, setNotes, newNote, fetchDocuments: refetch, selectedNoteId, setSelectedNoteId } as {
        notes: NoteBase[];
        setNotes: (documents: Note[]) => void;
        newNote: (noteData: any) => void;
        fetchDocuments: () => void;
        selectedNoteId: string;
        setSelectedNoteId: (id: string) => void;
    }
}