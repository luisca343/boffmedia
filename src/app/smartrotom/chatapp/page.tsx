/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import "./test.css";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import useSocketStore from "@/app/useSocketStore";
import { Chat } from "./_components/Chat";
import { CreateGroup } from "./_components/CreateGroup";
import {  Message as MessageType } from "./_types/Chat";
import useChats from "./_hooks/useChats";
import { Contact } from "./_components/Contact";

export default function ChatApp() {
  const { data: session } = useSession();
  const { chats, setChats, refresh, updateChats } = useChats(session);
  const [activeChat, setActiveChat] = useState(0);
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    if (socket) {
      socket.on("chat:message", (message: MessageType) => {
        updateChats(message, activeChat);
      });
    }
  }, [session]);

  return (
    <div className="w-full h-full flex">
      <div className="flex flex-col h-full w-1/4  bg-neutral-800  border-r border-neutral-900 ">
        <div className="h-16 p-2 text-xl w-full flex items-center text-neutral-50 ">
          <div>Chats</div>
          <CreateGroup setActiveChat={setChat} />
        </div>
        <div className="flex flex-col h-full  overflow-auto bg-neutral-800">
          {chats.map((chat) => (
            <Contact chat={chat} key={chat.id} activeChat={activeChat} setActiveChat={setChat} session={session}/>
          ))}
        </div>
      </div>
      <div className="flex flex-col w-3/4 h-full bg-neutral-700  overflow-hidden bg-center bg-cover bg-no-repeat  border-neutral-900">
        {activeChat ? (
          <Chat
            chats={chats}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-50">
            Selecciona un chat
          </div>
        )}
      </div>
    </div>
  );

  async function setChat(id: number) {
    const chat = chats.find((chat) => chat.id === id);
    if (!chat) {
      await refresh();
    }

    setActiveChat(id);
  }
}
