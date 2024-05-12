"use client"

import useSocketStore from "@/app/useSocketStore";
import { getSmartRotomUser } from "@/lib/utils";
import { rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Message } from "./Message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify';

type Message = {
    id: number;
    content: string;
    createdAt: string;
    uuid: string;
    chatId: number;
}

export type ChatData = {
    id: number;
    name: string;
    type: number;
    messages: Message[];
    unread: number;
    image: string;
    members: string[];

}

export function Chat({chats, activeChat, setActiveChat}: {chats: ChatData[], activeChat: number, setActiveChat: (id: number) => void}) {
    const [chat, setChat] = useState(chats[0] as ChatData); 
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
    
    function call(){
        /*
        mcefQuery('startCall', {uuid: getSmartRotomUser(session).uuid, members: chat.members.join(',')})
            .then((res: any) => {
                if(res.error) return toast.error(res.error)
            })
            .finally(() => {
                setActiveChat(0)
            })*/
        
        rotomPOST(`/chatapp/call/${chat.id}`, {uuid: getSmartRotomUser(session).uuid})
            .then((res) => {
                if(res.error) return toast.error(res.error)
        })
    }

    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="h-16 p-2 text-xl w-full bg-zinc-800 flex items-center text-white border-b border-zinc-900" > 
                <img src={chat.image} className="ml-2 rounded-full"  width='50px' height='50px'/>
                <div className="ml-2">{chat.name}</div>
                <Button className="ml-auto bg-inherit p-2" onClick={() => call()}><PhoneIcon height={30} width={30} strokeWidth={2} /></Button>
                <Button className="bg-inherit p-2" onClick={() => setActiveChat(0)}><XMarkIcon height={30} width={30} strokeWidth={2} /></Button>
            </div>
            <div className="w-full flex flex-col-reverse overflow-auto h-full items-start justify-start" style={{ backgroundImage: "url('/smartrotom/img/fondoChat2.avif')" }}>
                    {chat.messages.map((message, index) => {
                        const previousMessage = chat.messages[index + 1];
                        const currentGroup = chat//chats.find((chat) => chat.id === activeChat);
                        if(currentGroup?.type !== 1) return <Message message={message} session={session} key={message.id} img={true} prev={previousMessage?.uuid}/>
                        return (
                            <Message message={message} session={session} key={message.id} prev={previousMessage?.uuid}/>
                        )
                    })}
            </div>
            <div className="flex w-full h-16 bg-zinc-800 border-t border-b border-zinc-900 justify-center items-center" >
                <Input 
                onChange={(e) => setMessage(e.target.value)} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        sendMessage();
                        e.preventDefault(); // Prevents the addition of a new line in the input after pressing 'Enter'
                    }
        }} value={message} type="text" placeholder="Escribe un mensaje" className="h-full bg-zinc-800 text-white border-none rounded-none "/>
                <button type="submit" onClick={sendMessage} className="bg-primary-500 hover:bg-primary-600 text-black h-full w-24 rounded-xl font-bold border-2 border-black m-2">Enviar</button>
            </div>
        </div>
    );
}