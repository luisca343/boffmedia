"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "react-toastify"
import { Plus, Loader2, Users2, Search } from "lucide-react"
import { CabezaJugador } from "@/components/smartrotom/minecraft/CabezaMC"
import { Button } from "@/components/ui/primitives/button"
import { Checkbox } from "@/components/ui/primitives/checkbox"
import { Input } from "@/components/ui/primitives/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/primitives/dialog"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { getSmartRotomUser } from "@/lib/utils"
import { useBoffSession } from "@/services/useBoffSession"
import { useCreateChat } from "@/hooks/chatapp/useCreateChat"
import { useGetAllUsers } from "@/hooks/users/useGetAllUsers"

export function CreateGroup({ setActiveChat }: { setActiveChat: (id: number) => void }) {
  const { session } = useBoffSession()
  const { users, error: usersError, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsers()
  const { createChat, error: createChatError, isLoading: createChatLoading } = useCreateChat()
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([] as { username: string; uuid: string }[])
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const placeholderText = useMemo(() => {
    if (selectedUsers.length > 1) return "Nombre del grupo"
    if (selectedUsers.length === 1) return selectedUsers[0].username
    return "Mensajes Guardados"
  }, [selectedUsers])

  function handleOpenChange(open: boolean) {
    setOpen(open)
    if (open) {
      refetchUsers().catch((err) => {
        console.error("Error fetching users:", err);
        toast.error("Error al cargar la lista de usuarios");
      });
    } else {
      setSelectedUsers([])
      setGroupName("")
      setSearchQuery("")
    }
  }

  async function handleCreateChat() {
    const player = getSmartRotomUser(session).uuid

    try {
      if (selectedUsers.length === 0) {
        const result = (await createChat({
          player,
          users: [],
          name: "Mensajes Guardados",
        })) as any
        setActiveChat(result.data.id)
      } else if (groupName === "" && selectedUsers.length > 1) {
        return toast.error("Ingresa un nombre para el chat")
      } else {
        const result = await createChat({
          player,
          users: selectedUsers.map((user) => user.uuid),
          name: groupName,
        })
        setActiveChat(result.data?.chatId!)
      }
      setOpen(false)
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Error al crear el chat")
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
        <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 ml-auto hover:bg-primary/20">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-neutral-50 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            Crear nuevo chat
          </DialogTitle>
          <div className="relative mt-4">
            <Input
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-800 border-neutral-700 pl-9 focus-visible:ring-primary/50"
            />
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            {usersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
                      <Users2 className="h-10 w-10 mb-2" />
                      <p className="text-sm">
                        {searchQuery ? "No se encontraron usuarios" : "No hay usuarios disponibles"}
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        htmlFor={user.uuid}
                        key={user.uuid}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        <CabezaJugador
                          width={36}
                          height={36}
                          uuid={user.uuid}
                          nombreNPC={user.username}
                          autoRotate={false}
                          tag={false}
                          zoom={1}
                        />
                        <span className="flex-1 text-sm font-medium">{user.username}</span>
                        <Checkbox
                          id={user.uuid}
                          className="border-neutral-700"
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers((prev) => [...prev, user])
                            } else {
                              setSelectedUsers((prev) => prev.filter((u) => u.uuid !== user.uuid))
                            }
                          }}
                        />
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={placeholderText}
                className="bg-neutral-800 border-neutral-700 focus-visible:ring-primary/50"
                disabled={selectedUsers.length < 2}
              />
              <Button
                onClick={handleCreateChat}
                disabled={createChatLoading}
              >
                {createChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

