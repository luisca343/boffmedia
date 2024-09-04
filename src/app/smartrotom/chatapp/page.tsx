"use client"
import './test.css'
import {  useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { getSmartRotomUser, strToDate } from "@/lib/utils";
import useSocketStore from "@/app/useSocketStore";
import { Message } from "./_components/Message";
import { Chat, ChatData } from "./_components/Chat";
import { CreateGroup } from "./_components/CreateGroup";
import { PhoneIcon, ArrowUpRightIcon, ArrowDownLeftIcon, PhotoIcon, VideoCameraIcon, SpeakerWaveIcon} from '@heroicons/react/24/outline'


type Message = {
    id: number;
    content: string;
    createdAt: string;
    uuid: string;
    chatId: number;
    type: string;
}

export default function ChatApp() {
    const {data: session} = useSession();
    const [chats, setChats] = useState([] as ChatData[]); 
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
                    chat.messages.unshift({id: message.id, chatId:message.chatId, content: message.content, createdAt: message.createdAt, uuid: message.uuid, type: message.type});


                    chat.unread++;
                    return [...prev].sort((a, b) => {
                        const aDate = new Date(a.messages[0]?.createdAt) || new Date();
                        const bDate = new Date(b.messages[0]?.createdAt) || new Date();

                        return bDate.getTime() - aDate.getTime();
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
        getChats();
    } , [session])

    async function getChats(){
        rotomGET(`/chatapp/chats/${getSmartRotomUser(session).uuid}`)
            .then((res) => {
                setChats(res);
            })
    }

    function getCurrentChat(){
        return chats.find((chat) => chat.id === activeChat) as ChatData
    }



    return (
        <div className="w-full h-full flex">
            <div className="flex flex-col h-full w-1/4  bg-neutral-800  border-r border-neutral-900 ">
                <div className="h-16 p-2 text-xl w-full flex items-center text-neutral-50 " > 
                    <div>Chats</div>
                    <CreateGroup setActiveChat={setChat} />
                </div>
                <div className="flex flex-col h-full  overflow-auto bg-neutral-800">
                    {chats.map((chat) => <Contact {...chat} key={chat.id} />)}
                </div>
            </div>
            <div className="flex flex-col w-3/4 h-full bg-neutral-700  overflow-hidden bg-center bg-cover bg-no-repeat  border-neutral-900">
                {activeChat ? <Chat chats={chats} activeChat={activeChat} setActiveChat={setActiveChat}
                    /> : <div className="h-full flex items-center justify-center text-neutral-50">Selecciona un chat</div>}
            </div>
        </div>
    );

    async function setChat(id:number){

        const chat = chats.find((chat) => chat.id === id);
        if(!chat) {
            await getChats();
        }

        setActiveChat(id);
    }

        function LastMessage(chat: ChatData){
            let msg = chat?.messages[0] || null;
            if(!msg) return <p className="text-sm">No hay mensajes</p>
            if(msg.type === 'text') return (
                <p className="text-sm flex items-center">
                {msg.uuid === getSmartRotomUser(session).uuid 
                    ? <ArrowUpRightIcon className="mr-2 text-green-500" height={20} width={20} strokeWidth={2} /> 
                    : <ArrowDownLeftIcon className="mr-2 text-red-500" height={20} width={20} strokeWidth={2} />
                }

                <span>{chat?.messages[0]?.content.substring(0, 32) + (chat?.messages[0]?.content.length > 32 ? '...' : '')}</span> 
                </p>
            );

            if(msg.type === 'image') return (
                <p className="text-sm flex items-center">
                    <PhotoIcon className="mr-2 text-neutral-50" height={20} width={20} strokeWidth={2} />
                    <span>Imagen</span>
                </p>
            );

            if(msg.type === 'video') return (
                <p className="text-sm flex items-center">
                    <VideoCameraIcon className="mr-2 text-neutral-50" height={20} width={20} strokeWidth={2} />
                    <span>Video</span>
                </p>
            );

            if(msg.type === 'audio') return (
                <p className="text-sm flex items-center">
                    <SpeakerWaveIcon className="mr-2 text-neutral-50" height={20} width={20} strokeWidth={2} />
                    <span>Audio</span>
                </p>
            );

            if(msg.type === 'call') return (
                <p className="text-sm flex items-center">
                <PhoneIcon className="mr-2 text-neutral-50" height={20} width={20} strokeWidth={2} />
                    <span>Llamada de {msg.content} segundos</span>
                </p>
            );
            
        }
    
        function Contact(chat: ChatData){
            return (
                <div>
                    <div className={`${activeChat === chat.id ? 'bg-neutral-700' : 'bg-neutral-800'} hover:bg-neutral-700 h-[100px] flex items-center w-full`} onClick={()  => setActiveChat(chat.id)}>
                        <img src={chat.image} className="ml-2 rounded-full"  width='50px' height='50px'/>
                        <div className="h-1/2  ml-4 text-neutral-50  flex flex-col justify-between items-start ">
                            <p className="text-sm font-bold">{chat.name}</p>
                            {LastMessage(chat)}
                        </div>
                        <div className="h-1/2  ml-auto mr-4 text-neutral-50 flex flex-col justify-between items-end ">
                            <p className="text-sm">{strToDate(chat.messages[0]?.createdAt)}</p>
                            {chat.unread > 0 && <p className="flex items-center justify-center text-sm bg-primary-400  rounded-md w-6 h-6">{chat.unread}</p> }
                        </div>
                    </div>
                </div>
            );
        }
}

