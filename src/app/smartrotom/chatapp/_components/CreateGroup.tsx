"use client"
import { CabezaJugador } from "@/components/smartrotom/CabezaMC"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getSmartRotomUser } from "@/lib/utils"
import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession"
import { useState, useMemo, use, useEffect } from "react"
import { toast } from 'react-toastify'

export function CreateGroup({setActiveChat}: {setActiveChat: (id: number) => void}) {
    const { session } = useBoffSession();
    const [users, setUsers] = useState([] as any[]);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([] as {username: string, uuid: string}[]);
    const [placeholderText, setPlaceholderText] = useState('Selecciona al menos 2 usuarios');

    function openNewChat(open: boolean) {
        if (open) {
            rotomGET('/users')
                .then((res: {uuid:string}[]) => {
                    // Remove current user from list
                    const filteredUsers = res.filter((user) => user.uuid !== getSmartRotomUser(session).uuid);
                    setUsers(filteredUsers);

                    
                });
        } else {
            setUsers([]);
        }
    }

    function createChat(){
        const player = getSmartRotomUser(session).uuid;
        toast.info('Creando chat con ' + selectedUsers.map((user) => user.uuid).join(', '));
        if(selectedUsers.length == 0) {
            rotomPOST('/chatapp/chat', {player, users: [], name: 'Mensajes Guardados'}).then((res) => {
                setActiveChat(res);
            });
        } else if(groupName == '' && selectedUsers.length > 1) {
            toast.error('Ingresa un nombre para el chat');
        } else {
            rotomPOST('/chatapp/chat', {player, users: selectedUsers.map((user) => user.uuid), name: groupName})
                .then((res) => {
                    setActiveChat(res);
            })
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

    const memoizedUsers = useMemo(() => users.map((user) => (
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
    )), [users, setSelectedUsers]);

    return (
        <Popover onOpenChange={(open) => openNewChat(open)}>
            <PopoverTrigger className="ml-auto bg-primary-400 text-black h-8 w-8 rounded-full ">+</PopoverTrigger>
            <PopoverContent className="bg-neutral-800 text-neutral-50 w-[300px] p-4 border border-neutral-900">
                <div className="flex flex-col">
                    <div>Crear nuevo chat</div>
                    {memoizedUsers}
                    <div className="flex items-center border border-neutral-900 mt-2 rounded-md">
                        <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} type="text" placeholder={placeholderText} className="h-8 bg-neutral-800 text-neutral-50 border-none rounded-none" disabled={selectedUsers.length < 2} />
                        <Button className="bg-neutral-900 hover:bg-neutral-600" onClick={() => createChat()}>Crear</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}