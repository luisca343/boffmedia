"use client"

import { useState, useEffect } from "react"
import { strToDate } from "@/lib/utils"
import { useGetDocuments } from "../_hooks/useGetDocuments"
import { useGetDocument } from "../_hooks/useGetDocument"
import { Button } from "@/components/ui/button"
import { FileText, PlusCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import dynamic from "next/dynamic"

const CustomEditor = dynamic( () => {
    return import( '@/components/editor/TestEditor' );
  }, { ssr: false } );

export function DocumentsList() {
    const { documents, createNote, fetchDocuments, selectedNoteId, setSelectedNoteId } = useGetDocuments()
    const [searchTerm, setSearchTerm] = useState("")
    const [filteredDocuments, setFilteredDocuments] = useState(documents)
    const { data: selectedNote } = useGetDocument(selectedNoteId)

    useEffect(() => {
        setFilteredDocuments(
            documents.filter((doc) =>
                doc.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    }, [documents, searchTerm])

    const handleNoteClick = (id: string) => {
        setSelectedNoteId(id)
    }

    return (
        <div className="h-full flex">
            <div className="w-[15%] py-4 h-full bg-foreground border-r border-border flex flex-col">
                <div className="p-4">
                    <Button onClick={createNote} className="w-full" variant="default">
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
                                    className="p-2 rounded-lg hover:bg-foreground transition-colors mb-2 cursor-pointer"
                                >
                                    <div className="flex items-center">
                                        <FileText className="h-4 w-4 mr-2 text-text-primary0" />
                                        <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                                    </div>
                                    <p className="text-xs text-text-primary0 mt-1">{strToDate(doc.updatedAt)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-primary0 text-sm p-4">No notes found</p>
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
                        <p className="text-text-tertiary">Select a note from the sidebar or create a new one to get started.</p>
                    </>
                )}
            </div>
        </div>
    )
}