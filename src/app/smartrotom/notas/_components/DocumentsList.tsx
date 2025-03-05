"use client"

import { useState, useEffect } from "react"
import { strToDate } from "@/lib/utils"
import { useGetDocuments } from "../_hooks/useGetDocuments"
import { useGetDocument } from "../_hooks/useGetDocumentDeprecated"
import { Button } from "@/components/ui/button"
import { FileText, PlusCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import dynamic from "next/dynamic"

const CustomEditor = dynamic( () => {
    return import( '@/components/editor/TestEditor' );
  }, { ssr: false } );

export function DocumentsList() {
    const { notes, newNote, fetchDocuments, selectedNoteId, setSelectedNoteId } = useGetDocuments()
    const [searchTerm, setSearchTerm] = useState("")
    const [filteredDocuments, setFilteredDocuments] = useState(notes)
    const { data: selectedNote } = useGetDocument(selectedNoteId)

    

    useEffect(() => {
        if(!notes) return
        setFilteredDocuments(
            notes.filter((doc) =>
                doc.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    }, [notes, searchTerm])

    const handleNoteClick = (id: string) => {
        setSelectedNoteId(id)
    }

    if(!filteredDocuments) return null

    return (
        <div className="h-full flex">
            <div className="w-[15%] py-4 h-full bg-surface-100 border-r border-surface-200 flex flex-col">
                <div className="p-4">
                    <Button onClick={newNote} className="w-full" variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Nota
                    </Button>
                </div>
                <div className="px-4 mb-4">
                    <Input 
                        placeholder="Buscar notas..." 
                        className="w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="flex-grow">
                    {filteredDocuments.length > 0 ? (
                        <div className="px-2">
                            {filteredDocuments.map((doc: any) => (
                                <div 
                                    key={doc.uuid} 
                                    onClick={() => handleNoteClick(doc.id)}
                                    className="p-2 rounded-lg hover:bg-surface-200 transition-colors mb-2 cursor-pointer"
                                >
                                    <div className="flex items-center">
                                        <FileText className="h-4 w-4 mr-2 text-surface-500" />
                                        <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                                    </div>
                                    <p className="text-xs text-surface-500 mt-1">{strToDate(doc.updatedAt)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-surface-500 text-sm p-4">No notes found</p>
                    )}
                </ScrollArea>
            </div>
            <div className="w-[85%]  bg-white p-6 overflow-hidden">
                {selectedNoteId !="" ? (
                    <div className="w-full h-full">
                            <CustomEditor
                            document={selectedNote}
                            documentId={selectedNoteId}
                            documentType={0}
                            refresh={fetchDocuments}
    />
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold mb-4">Welcome to Your Notes</h1>
                        <p className="text-surface-600">Select a note from the sidebar or create a new one to get started.</p>
                    </>
                )}
            </div>
        </div>
    )
}