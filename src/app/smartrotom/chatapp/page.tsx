/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import "./test.css";
import { Chat } from "./_components/Chat";
import { useEffect, useState } from "react";
import useGetChats from "./_hooks/useGetChats";
import { Contact } from "./_components/Contact";
import {  Message as MessageType } from "./_types/Chat";
import { CreateGroup } from "./_components/CreateGroup";
import { useSocket } from "@/services/useSocket";

export default function ChatApp() {
  const { session, chats, refresh, updateChats, isLoading } = useGetChats();
  const [activeChat, setActiveChat] = useState(0);
  const {socket} = useSocket()
  const [typingUsers, setTypingUsers] = useState<Map<number, Map<string, string>>>(new Map())

  useEffect(() => {
    if (socket) {
      socket.on("chat:message", (message: MessageType) => {
        console.log("chat:message event received", message);
        updateChats(message, activeChat);
      });

      // Typing indicator events
      socket.on("chat:typing:start", (data: { chatId: number; uuid: string; username: string }) => {
        console.log("typing:start", data);
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(data.chatId)) {
            newMap.set(data.chatId, new Map());
          }
          newMap.get(data.chatId)!.set(data.uuid, data.username);
          return newMap;
        });
      });

      socket.on("chat:typing:stop", (data: { chatId: number; uuid: string }) => {
        console.log("typing:stop", data);
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const chatTypers = newMap.get(data.chatId);
          if (chatTypers) {
            chatTypers.delete(data.uuid);
            if (chatTypers.size === 0) {
              newMap.delete(data.chatId);
            }
          }
          return newMap;
        });
      });

      return () => {
        socket.off("chat:message");
        socket.off("chat:typing:start");
        socket.off("chat:typing:stop");
      };
    }
  }, [socket, activeChat, updateChats]);

  if (!chats) return null;
  
  return (
    <div className="w-full h-full flex overflow-hidden">
    <div className="flex flex-col h-full w-1/4 bg-neutral-800 border-r border-neutral-900">
      <div className="h-[4.25rem] p-2 text-xl w-full flex items-center justify-between text-neutral-50 border-b border-neutral-900">
          <div>Chats</div>
          <CreateGroup setActiveChat={setChat} />
        </div>
        <div className="flex flex-col h-full  overflow-auto bg-neutral-800">
          {chats!.map((chat:any) => (
            <Contact chat={chat} key={chat.id} activeChat={activeChat} setActiveChat={setChat} session={session}/>
          ))}
        </div>
      </div>
      <div className="flex flex-col w-3/4 h-full bg-neutral-700  overflow-hidden bg-center bg-cover bg-no-repeat  border-neutral-900">
        {activeChat ? (
          <Chat
            chats={chats!}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            onMessageSent={updateChats}
            typingUsers={typingUsers.get(activeChat)}
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
    const chat = chats!.find((chat:any) => chat.id === id);
    if (!chat) {
      await refresh();
    }

    setActiveChat(id);
  }
}
