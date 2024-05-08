"use client"
import { Loading } from "@/components/smartrotom/Loading";
import './test.css'
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { getDatosUsuarioMC } from "@/services/mcefHelper";
import { getSmartRotomUser, strToDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import useSocketStore from "@/app/useSocketStore";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { CabezaJugador } from "@/components/smartrotom/CabezaMC";

type Chat = {
    id: number;
    name: string;
    type: number;
    lastMessage: {id: number, content: string, createdAt: string};
    unread: number;
    image: string;

}

type Message = {
    id: number;
    text: string;
    date: Date;
    uuid: string;
}


export default function ChatApp() {
    const {data: session} = useSession();
    const [chats, setChats] = useState([] as Chat[]); 
    const [activeChat, setActiveChat] = useState(0);

    const [users, setUsers] = useState([] as any[]); // [ {uuid: string, name: string, image: string}
    const { socket, connect } = useSocketStore();

    useEffect(() => {
        if(socket){
            socket.on('chat:message', (message: Message) => {
                setChats((prev) => {
                    const chat = prev.find((chat) => chat.id == message.id);
                    if(!chat) return prev;
                    chat.lastMessage = {id: message.id, content: message.text, createdAt: message.date.toString()};
                    chat.unread++;
                    return [...prev].sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
                })})
        }
    } , [session])


    /*
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActiveChat(0);
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);*/

    useEffect(() => {
        rotomGET(`/chatapp/chats/${getSmartRotomUser(session).uuid}`)
            .then((res) => {
                setChats(res);
            })
    } , [session])

    function getCurrentChat(){
        return chats.find((chat) => chat.id === activeChat) as Chat
    }


    function openNewChat(open: boolean){
        if(open) {
            console.log('Abriendo')
            rotomGET('/users')
            .then((res) => {
                setUsers(res);
            })
        } else {
            console.log('Cerrando')
            setUsers([]);
        }
    }

    function createChat(user: any){
        console.log('Creando chat con ' + user.uuid)
        console.log('Usuario actual ' + getSmartRotomUser(session).uuid)

        rotomPOST('/chatapp/chat', {uuid1: getSmartRotomUser(session).uuid, uuid2: user.uuid})
            .then((res) => {
                setActiveChat(res);
            })
    }

    return (
        <div className="w-full h-full overflow-hidden flex">
            <div className="flex flex-col h-full overflow-hidden w-1/4  bg-zinc-800  border-r border-zinc-900">
                <div className="h-16 p-2 text-xl w-full flex items-center text-white" > 
                    <div>Chats</div>
                    <Popover onOpenChange={(open) => openNewChat(open)}>
                        <PopoverTrigger className="ml-auto bg-primary-400 text-black h-8 w-8 rounded-full">+</PopoverTrigger>
                        <PopoverContent className="bg-zinc-800 text-white">
                            <div className="flex flex-col">
                                {users.map((user) => {
                                    return (
                                        <button onClick={() => createChat(user)} className="flex items-center" key={user.uuid}>
                                            <CabezaJugador width={50} height={50} uuid={user.uuid} nombreNPC={user.username} autoRotate={false} tag={false} zoom={1} />
                                            <div className="ml-2">{user.username}</div>
                                        </button>
                                    )
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-col  overflow-auto bg-zinc-800">
                    {chats.map((chat) => <Contact {...chat} key={chat.id} />)}
                </div>
            </div>
            <div className="flex flex-col w-3/4  bg-zinc-700  overflow-auto bg-center bg-cover bg-no-repeat  border-zinc-900">
                {activeChat ? <Chat chat={getCurrentChat()} 
                    /> : <div className="h-full flex items-center justify-center text-white">Selecciona un chat</div>}
            </div>
        </div>
    );


    
        function Contact(chat: Chat){
            return (
                <div className={`${activeChat === chat.id ? 'bg-zinc-700' : 'bg-zinc-800'} hover:bg-zinc-700 h-24 flex items-center w-full `} onClick={()  => setActiveChat(chat.id)}>
                    <img src={chat.image} className="ml-2 rounded-full"  width='50px' height='50px'/>
                    <div className="h-1/2  ml-4 text-white  flex flex-col justify-between items-start ">
                        <p className="text-sm font-bold">{chat.name}</p>
                        <p className="text-sm">{(chat?.lastMessage?.content.substring(0, 32) || 'No hay mensajes') + (chat?.lastMessage?.content.length > 32 ? '...' : '')}</p>
                    </div>
                    <div className="h-1/2  ml-auto mr-4 text-white flex flex-col justify-between items-end ">
                        <p className="text-sm">{strToDate(chat.lastMessage?.createdAt)}</p>
                        {chat.unread > 0 && <p className="flex items-center justify-center text-sm bg-primary-400  rounded-md w-6 h-6">{chat.unread}</p> }
                    </div>
                </div>
            );
        }

        function Chat({chat}: {chat: Chat}){
            const [messages, setMessages] = useState([] as Message[]);
            const [message, setMessage] = useState('' as string);
            const { socket, connect } = useSocketStore();
            
            
            useEffect(() => {
                rotomGET(`/chatapp/messages/${chat.id}`)
                    .then((res) => {
                        setMessages(res);
                    })

                if(socket){
                    console.log('Conectando socket')
                    console.log(socket.id)
                    socket.on('chat:message', (message: Message) => {
                        setMessages((prev) => [...prev, message])
                    })
                }
                    

            } , [session])

            function sendMessage(){
                rotomPOST(`/chatapp/messages/${chat.id}`, {mensaje: message, uuid: getSmartRotomUser(session).uuid})
                    .then((res) => {
                        setMessage('');
                    })
            }
            

            return (
                <div className="flex flex-col w-full h-full " style={{ backgroundImage: "url('/smartrotom/img/fondoChat2.avif')" }}>
                    <div className="h-16 p-2 text-xl w-full bg-zinc-800 flex items-center text-white border-b border-zinc-900" > 
                        <img src={chat.image} className="ml-2 rounded-full"  width='50px' height='50px'/>
                        <div className="ml-2">{chat.name}</div>
                    </div>
                    <div className="w-full flex flex-col overflow-auto items-start flex-1 justify-end">
                        {messages.map((message) => {
                            return (
                                <div className={`m-2 bg-primary-400 p-2 max-w-[50%] ${message.uuid === getSmartRotomUser(session).uuid ? 'self-end' :null}`} key={message.id}>
                                    <p>{message.text}</p>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex w-full h-16 bg-zinc-800 border-t border-b border-zinc-900" >
                        <Input onChange={(e) => setMessage(e.target.value)} type="text" placeholder="Escribe un mensaje" className="h-full bg-zinc-800 text-white border-none rounded-none "/>
                        <button onClick={sendMessage} className="bg-primary-400 text-black h-full w-16">Enviar</button>
                    </div>
                </div>
            );
        }
}

