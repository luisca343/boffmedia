"use client"

import { useState, useEffect } from "react"
import { strToDate } from "@/lib/utils"
import { useGetDocuments } from "../_hooks/useGetDocuments"
import { Button } from "@/components/ui/primitives/button"
import { FileText, PlusCircle } from "lucide-react"
import { Input } from "@/components/ui/primitives/input"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import dynamic from "next/dynamic"
import { useGetDocument } from "@/hooks/documents/useGetDocument"
import { ShareDocumentDialog } from "./ShareDocumentDialog"
import { useSearchParams } from "next/navigation"

const CustomEditor = dynamic( () => {
    return import( '@/components/shared/ckeditor/TestEditor' );
  }, { ssr: false } );

  export function DocumentsList() {
    const searchParams = useSearchParams()
    const docId = searchParams?.get("doc")
    const { notes, newNote, fetchDocuments, selectedNoteId, setSelectedNoteId } = useGetDocuments()
    const [searchTerm, setSearchTerm] = useState("")
    const [filteredDocuments, setFilteredDocuments] = useState(notes)
    const { document: selectedNote } = useGetDocument(parseInt(selectedNoteId))

    useEffect(() => {
        if(!notes) return
        setFilteredDocuments(
            notes.filter((doc) =>
                doc.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    }, [notes, searchTerm])

    useEffect(() => {
        if (docId && notes) {
            setSelectedNoteId(docId)
        }
    }, [docId, notes])

    const handleNoteClick = (id: string) => {
        setSelectedNoteId(id)
    }

    if(!filteredDocuments) return null

    return (
        <div className="h-full flex">
            <div className="w-[240px] py-4 h-full bg-base border-r border-edge flex flex-col shadow-sm">
                <div className="px-4 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-center">Mis Notas</h2>
                    <Button onClick={newNote} className="w-full" variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Nota
                    </Button>
                </div>
                <div className="px-4 mb-6">
                    <div className="relative">
                        <Input 
                            placeholder="Buscar notas..." 
                            className="w-full pl-8 bg-layer-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-2 top-2.5 text-ink-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                    </div>
                </div>
                <ScrollArea className="flex-grow px-2">
                    {filteredDocuments.length > 0 ? (
                        <div className="space-y-1">
                            {filteredDocuments.map((doc: any) => (
                                <div 
                                    key={doc.id} 
                                    onClick={() => handleNoteClick(doc.id)}
                                    className={`p-3 rounded-md transition-colors cursor-pointer flex flex-col ${
                                        selectedNoteId === doc.id 
                                        ? "bg-primary/10 border-l-2 border-primary" 
                                        : "hover:bg-layer-1"
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <FileText className={`h-4 w-4 mr-2 ${selectedNoteId === doc.id ? "text-primary" : "text-ink-muted"}`} />
                                        <h3 className={`font-medium text-sm truncate ${selectedNoteId === doc.id ? "text-primary" : ""}`}>
                                            {doc.title || "Untitled Note"}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-ink-muted mt-1 ml-6">{strToDate(doc.updatedAt)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <FileText className="h-10 w-10 text-ink mb-2" />
                            <p className="text-ink-muted text-sm">No se encontraron notas</p>
                        </div>
                    )}
                </ScrollArea>
            </div>
            
            <div className="flex-1 bg-white overflow-hidden flex flex-col">
                {selectedNoteId !== "" ? (
                    <div className="w-full h-full flex flex-col">
                        <div className="border-b border-edge px-4 py-3 flex items-center justify-between bg-base">
                            <h2 className="text-lg font-semibold text-ink-dim">
                                {selectedNote?.title || "Cargando..."}
                            </h2>
                            {selectedNote && (
                                <ShareDocumentDialog document={selectedNote} />
                            )}
                        </div>
                        <div className="flex-1 overflow-auto">
                            <CustomEditor
                                document={selectedNote}
                                documentId={selectedNoteId}
                                documentType={0}
                                refresh={fetchDocuments}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 bg-base">
                        <div className="max-w-md text-center">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-ink" />
                            <h1 className="text-2xl font-bold mb-3">Notas SmartRotom</h1>
                            <p className="text-ink-dim mb-6">Selecciona una nota desde el panel lateral o crea una nueva para comenzar.</p>
                            <Button onClick={newNote} variant="default" size="lg">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Nueva Nota
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}