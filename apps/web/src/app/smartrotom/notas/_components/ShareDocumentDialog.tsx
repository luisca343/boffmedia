"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "react-toastify"
import { Share2, Loader2, Search, Send } from "lucide-react"
import { CabezaJugador } from "@/components/smartrotom/minecraft/CabezaMC"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/primitives/dialog"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { getSmartRotomUser } from "@/lib/utils"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetAllUsers } from "@/hooks/users/useGetAllUsers"
import { ChatAppService } from "@/services/api/smartrotom/chatAppService"
import { DocumentsService } from "@/services/api/smartrotom/documentsService"
import { CreateMessageDto } from "@boffmedia/shared"
import type { Document } from "@boffmedia/shared"

interface ShareDocumentDialogProps {
  document: Document
}

export function ShareDocumentDialog({ document }: ShareDocumentDialogProps) {
  const { session } = useBoffSession()
  const { users, error: usersError, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsers()
  const [selectedUser, setSelectedUser] = useState<{ username: string; uuid: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sending, setSending] = useState(false)

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (open) {
      refetchUsers()
    } else {
      setSelectedUser(null)
      setSearchQuery("")
    }
  }

  async function handleShare() {
    if (!selectedUser) {
      toast.error("Selecciona un usuario")
      return
    }

    const player = getSmartRotomUser(session).uuid

    try {
      setSending(true)

      // First, create or get chat with the user
      const chatResult = await ChatAppService.createChat({
        player,
        users: [selectedUser.uuid],
        name: "",
      })

      console.log("Chat created or retrieved:", chatResult)
      const chatId = chatResult.data?.chatId

      if (!chatId) {
        toast.error("Error al crear el chat")
        return
      }

      // Prepare document data
      const documentData = {
        documentId: document.id,
        title: document.title,
      }

      // Send document message
      await ChatAppService.createMessage(chatId, {
        message: JSON.stringify(documentData),
        uuid: player,
        type: CreateMessageDto.type.DOCUMENT,
      })

      await DocumentsService.addNoteToUser(document.id, selectedUser.uuid)

      toast.success(`Documento compartido con ${selectedUser.username}`)
      setOpen(false)
    } catch (error) {
      console.error("Failed to share document:", error)
      toast.error("Error al compartir el documento")
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (usersError) {
      toast.error("Error al cargar usuarios")
    }
  }, [usersError])

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users
      .filter((user) => user.uuid !== getSmartRotomUser(session).uuid)
      .filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [users, session, searchQuery])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-neutral-50 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartir documento
          </DialogTitle>
          <p className="text-sm text-neutral-400 mt-2">
            Compartir &quot;{document.title}&quot; con un usuario
          </p>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar usuario..."
              className="pl-9 bg-neutral-800 border-neutral-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border border-neutral-800">
              <div className="p-2 space-y-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.uuid}
                      onClick={() => setSelectedUser(user)}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        selectedUser?.uuid === user.uuid
                          ? "bg-primary-hover/20 border border-primary"
                          : "hover:bg-neutral-800"
                      }`}
                    >
                      <CabezaJugador uuid={user.uuid} nombreNPC={user.username} width={40} height={40} />
                      <div className="flex-1">
                        <p className="font-medium">{user.username}</p>
                      </div>
                      {selectedUser?.uuid === user.uuid && (
                        <div className="w-2 h-2 rounded-full bg-primary-hover" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                    <Search className="h-10 w-10 mb-2" />
                    <p className="text-sm">No se encontraron usuarios</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-neutral-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleShare}
              disabled={!selectedUser || sending}
              className="bg-primary-hover hover:bg-primary text-black"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Compartiendo...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Compartir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
