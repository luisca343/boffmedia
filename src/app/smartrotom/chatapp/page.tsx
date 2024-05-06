"use client"
import { Loading } from "@/components/smartrotom/Loading";
import './test.css'
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { rotomGET } from "@/services/boffAPI";
import { getDatosUsuarioMC } from "@/services/mcefHelper";
import { getSmartRotomUser, strToDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Chat = {
    id: number;
    name: string;
    type: number;
    lastMessage: {id: number, content: string, createdAt: string};
    unread: number;
    image: string;

}

type Message = {
    id: string;
    text: string;
    date: Date;
    uuid: string;
}


export default function ChatApp() {
    const {data: session} = useSession();
    const [chats, setChats] = useState([] as Chat[]); 
    const [activeChat, setActiveChat] = useState(0);

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
    
    return (
        <div className="w-full h-full overflow-hidden flex">
            <div className="flex flex-col h-full overflow-hidden w-1/4  bg-zinc-800  border-r border-zinc-900">
                <div className="h-16 p-2 text-xl w-full flex items-center text-white" > 
                    Chats
                </div>
                <div className="flex   overflow-auto bg-zinc-800">
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
                    <img src={`/smartrotom/img/apps/chatapp/${chat.image}`} className="ml-2 rounded-full"  width='50px' height='50px'/>
                    <div className="h-1/2  ml-4 text-white  flex flex-col justify-between items-start ">
                        <p className="text-sm font-bold">{chat.name}</p>
                        <p className="text-sm">{chat.lastMessage.content || 'No hay mensajes'}</p>
                    </div>
                    <div className="h-1/2  ml-auto mr-4 text-white flex flex-col justify-between items-end ">
                        <p className="text-sm">{strToDate(chat.lastMessage.createdAt)}</p>
                        {chat.unread > 0 && <p className="flex items-center justify-center text-sm bg-primary-400  rounded-md w-6 h-6">{chat.unread}</p> }
                    </div>
                </div>
            );
        }

        function Chat({chat}: {chat: Chat}){
            const [messages, setMessages] = useState([] as Message[]);
            useEffect(() => {
                rotomGET(`/chatapp/messages/${chat.id}`)
                    .then((res) => {
                        setMessages(res);
                    })
            } , [session])

            return (
                <div className="flex flex-col w-full h-full " style={{ backgroundImage: "url('/smartrotom/img/fondoChat2.avif')" }}>
                    <div className="h-16 p-2 text-xl w-full bg-zinc-800 flex items-center text-white border-b border-zinc-900" > 
                        <img src={`/smartrotom/img/apps/chatapp/${chat.image}`} className="ml-2 rounded-full"  width='50px' height='50px'/>
                        <div className="ml-2">{chat.name}</div>
                    </div>
                    <div className="w-full flex flex-col overflow-auto items-start flex-1 justify-end">
                        {messages.map((message) => {
                            return (
                                <div className={`m-2 bg-primary-400 p-2 ${message.uuid === getSmartRotomUser(session).uuid ? 'self-end' :null}`} key={message.id}>
                                    <p>{message.text}</p>
                                </div>
                            )
                        })}
                    </div>
                    <Input type="text" placeholder="Escribe un mensaje" className="w-full h-16 bg-zinc-800 text-white border-t border-zinc-900" />
                </div>
            );
        }
}

