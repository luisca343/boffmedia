"use client"

import { useState, useEffect } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { Input } from "@/components/ui/primitives/input"
import { useGetNotes } from "@/hooks/documents/useGetNotes"
import { useBoffSession } from "@/services/useBoffSession"
import { strToDate } from "@/lib/utils"

interface DocumentPickerProps {
  onDocumentSelect: (document: { id: string; title: string; content: string }) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DocumentPicker({ onDocumentSelect, open: externalOpen, onOpenChange }: DocumentPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  const { session } = useBoffSession()
  const { notes, isLoading } = useGetNotes(session?.user.smartRotomUser?.uuid as string)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDocuments, setFilteredDocuments] = useState(notes || [])

  useEffect(() => {
    if (!notes) return
    setFilteredDocuments(
      notes.filter((doc) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [notes, searchTerm])

  function handleSelectDocument(doc: any) {
    onDocumentSelect({
      id: doc.id,
      title: doc.title,
      content: doc.content
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 text-neutral-50 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compartir documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Buscar documentos..."
              className="w-full bg-neutral-800 border-neutral-700 text-neutral-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Documents List */}
          <ScrollArea className="h-[400px] rounded-lg border border-neutral-800">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            ) : filteredDocuments && filteredDocuments.length > 0 ? (
              <div className="space-y-1 p-2">
                {filteredDocuments.map((doc: any) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className="w-full p-3 rounded-lg hover:bg-neutral-800 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-neutral-50 truncate group-hover:text-primary-400 transition-colors">
                          {doc.title || "Documento sin título"}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          Actualizado: {strToDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <FileText className="h-12 w-12 text-neutral-600 mb-3" />
                <p className="text-neutral-400 text-sm">
                  {searchTerm ? "No se encontraron documentos" : "No tienes documentos"}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
