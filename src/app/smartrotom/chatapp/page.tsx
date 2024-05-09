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
import { Message } from "./_components/Message";
import { Chat } from "./_components/Chat";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateGroup } from "./_components/CreateGroup";

type Chat = {
    id: number;
    name: string;
    type: number;
    messages: Message[];
    unread: number;
    image: string;

}

type Message = {
    id: number;
    content: string;
    createdAt: string;
    uuid: string;
    chatId: number;
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
                    const chat = prev.find((chat) => chat.id == message.chatId);
                    if(!chat) return prev;
                    //chat.lastMessage = {id: message.id, content: message.text, createdAt: message.date.toString()};
                    chat.messages.unshift({id: message.id, chatId:message.chatId, content: message.content, createdAt: message.createdAt, uuid: message.uuid});


                    chat.unread++;
                    return [...prev].sort((a, b) => {
                        return new Date(b.messages[0].createdAt).getTime() - new Date(a.messages[0].createdAt).getTime();
                    })
                })
            
                if(activeChat !== message.id) return;
                
                
                
            })
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



    return (
        <div className="w-full h-full flex">
            <div className="flex flex-col h-full w-1/4  bg-zinc-800  border-r border-zinc-900 ">
                <div className="h-16 p-2 text-xl w-full flex items-center text-white " > 
                    <div>Chats</div>
                    <CreateGroup setActiveChat={setActiveChat} />
                </div>
                <div className="flex flex-col h-full  overflow-auto bg-zinc-800">
                    {chats.map((chat) => <Contact {...chat} key={chat.id} />)}
                </div>
            </div>
            <div className="flex flex-col w-3/4 h-full bg-zinc-700  overflow-hidden bg-center bg-cover bg-no-repeat  border-zinc-900">
                {activeChat ? <Chat chats={chats} activeChat={activeChat}
                    /> : <div className="h-full flex items-center justify-center text-white">Selecciona un chat</div>}
            </div>
        </div>
    );


    
        function Contact(chat: Chat){
            return (
                <div>
                    <div className={`${activeChat === chat.id ? 'bg-zinc-700' : 'bg-zinc-800'} hover:bg-zinc-700 h-[100px] flex items-center w-full`} onClick={()  => setActiveChat(chat.id)}>
                        <img src={chat.image} className="ml-2 rounded-full"  width='50px' height='50px'/>
                        <div className="h-1/2  ml-4 text-white  flex flex-col justify-between items-start ">
                            <p className="text-sm font-bold">{chat.name}</p>
                            <p className="text-sm">{(chat?.messages[0]?.content.substring(0, 32) || 'No hay mensajes') + (chat?.messages[0]?.content.length > 32 ? '...' : '')}</p>
                        </div>
                        <div className="h-1/2  ml-auto mr-4 text-white flex flex-col justify-between items-end ">
                            <p className="text-sm">{strToDate(chat.messages[0]?.createdAt)}</p>
                            {chat.unread > 0 && <p className="flex items-center justify-center text-sm bg-primary-400  rounded-md w-6 h-6">{chat.unread}</p> }
                        </div>
                    </div>
                </div>
            );
        }
}

