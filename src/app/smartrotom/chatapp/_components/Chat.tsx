"use client"

import useSocketStore from "@/app/useSocketStore";
import { getSmartRotomUser } from "@/lib/utils";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Message } from "./Message";
import { Input } from "@/components/ui/input";

type Message = {
    id: number;
    content: string;
    createdAt: Date;
    uuid: string;
    chatId: number;
}

type Chat = {
    id: number;
    name: string;
    type: number;
    messages: Message[];
    unread: number;
    image: string;

}

export function Chat({chats, activeChat}: {chats: Chat[], activeChat: number}){
    const [chat, setChat] = useState(chats[0] as Chat); 
    const [message, setMessage] = useState('' as string);
    const { socket, connect } = useSocketStore();
    const {data: session} = useSession();

        const messagesEndRef = useRef(null);

        useEffect(() => {
            // @ts-ignore
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, [chat.messages]);
    
    useEffect(() => {
        const chat = chats.find((chat) => chat.id === activeChat);
        if(!chat) return;
        setChat(chat);
        /*
        rotomGET(`/chatapp/messages/${chat.id}`)
            .then((res) => {
                console.log(`Messages from chat ${chat.id}`, res)
                setMessages(res);
            })*/

        if(socket){
            /*
            socket.on('chat:message', (message: Message) => {
                setMessages((prev) => [...prev, message])
            })*/
        }
            

    } , [activeChat])

    function sendMessage(){
        rotomPOST(`/chatapp/messages/${chat.id}`, {mensaje: message, uuid: getSmartRotomUser(session).uuid})
            .then((res) => {
                setMessage('');
            })
    }
    

    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="h-16 p-2 text-xl w-full bg-zinc-800 flex items-center text-white border-b border-zinc-900" > 
                <img src={chat.image} className="ml-2 rounded-full"  width='50px' height='50px'/>
                <div className="ml-2">{chat.name}</div>
            </div>
            <div className="w-full  flex-col overflow-auto h-full"  style={{ backgroundImage: "url('/smartrotom/img/fondoChat2.avif')" }}>
                <div className="w-full flex flex-col overflow-auto items-start  justify-end" >
                    {[...chat.messages].reverse().map((message) => {
                        const currentGroup = chat//chats.find((chat) => chat.id === activeChat);
                        if(currentGroup?.type !== 1) return <Message message={message} session={session} key={message.id} img={true}/>
                        return (
                            <Message message={message} session={session} key={message.id}/>
                        )
                    })}
                </div>
                <div ref={messagesEndRef} />
            </div>
            <div className="flex w-full h-16 bg-zinc-800 border-t border-b border-zinc-900" >
                <Input onChange={(e) => setMessage(e.target.value)} value={message} type="text" placeholder="Escribe un mensaje" className="h-full bg-zinc-800 text-white border-none rounded-none "/>
                <button onClick={sendMessage} className="bg-primary-400 text-black h-full">Enviar</button>
            </div>
        </div>
    );
}