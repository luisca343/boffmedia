"use client"
import { useState, useMemo, useEffect } from "react"
import { toast } from 'react-toastify'
import { CabezaJugador } from "@/components/smartrotom/minecraft/CabezaMC"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getSmartRotomUser } from "@/lib/utils"
import { useBoffSession } from "@/services/useBoffSession"
import { useCreateChat } from "@/hooks/chatapp/useCreateChat"
import { useGetAllUsers } from "@/hooks/users/useGetAllUsers"

export function CreateGroup({setActiveChat}: {setActiveChat: (id: number) => void}) {
    const { session } = useBoffSession();
    const { users, error: usersError, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsers();
    const { createChat, error: createChatError, isLoading: createChatLoading } = useCreateChat();
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([] as {username: string, uuid: string}[]);
    const [placeholderText, setPlaceholderText] = useState('Selecciona al menos 2 usuarios');

    function openNewChat(open: boolean) {
        if (open) {
            refetchUsers();
        } else {
            setSelectedUsers([]);
            setGroupName('');
        }
    }

    async function handleCreateChat() {
        const player = getSmartRotomUser(session).uuid;
        toast.info('Creando chat con ' + selectedUsers.map((user) => user.uuid).join(', '));
        
        try {
            let result;
            if (selectedUsers.length === 0) {
                result = await createChat({ player, users: [], name: 'Mensajes Guardados' }) as any;
            } else if (groupName === '' && selectedUsers.length > 1) {
                return toast.error('Ingresa un nombre para el chat');
            } else {
                result = await createChat({ player, users: selectedUsers.map((user) => user.uuid), name: groupName });
            }
            setActiveChat(result.data.id);
        } catch (error) {
            toast.error('Error al crear el chat');
        }
    }

    useEffect(() => {
        if (selectedUsers.length > 1) {
            setPlaceholderText('Nombre del grupo');
        } else if (selectedUsers.length === 1) {
            setPlaceholderText(selectedUsers[0].username);
        } else {
            setPlaceholderText('Mensajes Guardados');
        }
    }, [selectedUsers]);

    useEffect(() => {
        if (usersError) {
            toast.error('Error al cargar usuarios');
        }
    }, [usersError]);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter((user) => user.uuid !== getSmartRotomUser(session).uuid);
    }, [users, session]);

    const memoizedUsers = useMemo(() => filteredUsers.map((user) => (
        <div className="flex items-center hover:bg-neutral-500" key={user.uuid}>
            <label htmlFor={user.uuid} className="w-full flex items-center">
                <CabezaJugador width={30} height={30} uuid={user.uuid} nombreNPC={user.username} autoRotate={false} tag={false} zoom={1} />
                <div className="ml-2">{user.username}</div>
                <Checkbox id={user.uuid} className="ml-auto" onCheckedChange={(checked: boolean) => {
                    if (checked) setSelectedUsers((prev) => [...prev, user]);
                    else setSelectedUsers((prev) => prev.filter((u) => u.uuid !== user.uuid));
                }} />
            </label>
        </div>
    )), [filteredUsers, setSelectedUsers]);

    return (
        <Popover onOpenChange={(open) => openNewChat(open)}>
            <PopoverTrigger className="ml-auto bg-primary-400 text-black h-8 w-8 rounded-full ">+</PopoverTrigger>
            <PopoverContent className="bg-neutral-800 text-neutral-50 w-[300px] p-4 border border-neutral-900">
                <div className="flex flex-col">
                    <div>Crear nuevo chat</div>
                    {usersLoading ? (
                        <div>Cargando usuarios...</div>
                    ) : (
                        memoizedUsers
                    )}
                    <div className="flex items-center border border-neutral-900 mt-2 rounded-md">
                        <Input 
                            value={groupName} 
                            onChange={(e) => setGroupName(e.target.value)} 
                            type="text" 
                            placeholder={placeholderText} 
                            className="h-8 bg-neutral-800 text-neutral-50 border-none rounded-none" 
                            disabled={selectedUsers.length < 2} 
                        />
                        <Button 
                            className="bg-neutral-900 hover:bg-neutral-600 text-neutral-100" 
                            onClick={handleCreateChat}
                            disabled={createChatLoading}
                        >
                            {createChatLoading ? 'Creando...' : 'Crear'}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

