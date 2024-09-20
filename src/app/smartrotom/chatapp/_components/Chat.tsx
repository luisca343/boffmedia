/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import useSocketStore from "@/app/useSocketStore";
import { getSmartRotomUser } from "@/lib/utils";
import { rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Message } from "./Message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { ChatData } from "../_types/Chat";
import { Phone, Send, X } from "lucide-react";

export function Chat({
  chats,
  activeChat,
  setActiveChat,
}: {
  chats: ChatData[];
  activeChat: number;
  setActiveChat: (id: number) => void;
}) {
  const [chat, setChat] = useState(chats[0] as ChatData);
  const [message, setMessage] = useState("" as string);
  const { socket, connect } = useSocketStore();
  const { data: session } = useSession();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // @ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  useEffect(() => {
    const chat = chats.find((chat) => chat.id === activeChat);
    if (!chat) return;
    setChat(chat);
    /*
        rotomGET(`/chatapp/messages/${chat.id}`)
            .then((res) => {
                console.log(`Messages from chat ${chat.id}`, res)
                setMessages(res);
            })*/

    if (socket) {
      /*
            socket.on('chat:message', (message: Message) => {
                setMessages((prev) => [...prev, message])
            })*/
    }
  }, [activeChat]);

  function sendMessage() {
    if (!message.trim()) {
      return;
    }

    rotomPOST(`/chatapp/messages/${chat.id}`, {
      mensaje: message,
      uuid: getSmartRotomUser(session).uuid,
    }).then((res) => {
      setMessage("");
    });
  }

  function call() {
    /*
        mcefQuery('startCall', {uuid: getSmartRotomUser(session).uuid, members: chat.members.join(',')})
            .then((res: any) => {
                if(res.error) return toast.error(res.error)
            })
            .finally(() => {
                setActiveChat(0)
            })*/

    rotomPOST(`/chatapp/call/${chat.id}`, {
      uuid: getSmartRotomUser(session).uuid,
    }).then((res) => {
      if (res.error) return toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="h-16 p-2 text-xl w-full bg-neutral-800 flex items-center text-neutral-50 border-b border-neutral-900">
        <img
          src={chat.image}
          className="ml-2 rounded-full"
          width="50px"
          height="50px"
          alt=""
        />
        <div className="ml-2">{chat.name}</div>
        <Button className="ml-auto bg-inherit p-2" onClick={() => call()}>
          <Phone height={30} width={30} strokeWidth={2} />
        </Button>
        <Button className="bg-inherit p-2" onClick={() => setActiveChat(0)}>
          <X height={30} width={30} strokeWidth={2} />
        </Button>
      </div>
      <div
        className="w-full flex flex-col-reverse overflow-auto h-full items-start justify-start"
        style={{ backgroundImage: "url('/smartrotom/img/fondoChat2.avif')" }}
      >
        {chat.messages.map((message, index) => {
          const previousMessage = chat.messages[index + 1];
          const currentGroup = chat; //chats.find((chat) => chat.id === activeChat);
          if (currentGroup?.type !== 1)
            return (
              <Message
                message={message}
                session={session}
                key={message.id}
                img={true}
                prev={previousMessage?.uuid}
              />
            );
          return (
            <Message
              message={message}
              session={session}
              key={message.id}
              prev={previousMessage?.uuid}
            />
          );
        })}
      </div>
      <div className="p-4 bg-neutral-800 flex items-center space-x-2 border-t border-black">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Escribe un mensaje"
          className="flex-1"
        />
        <Button
          type="submit"
          onClick={sendMessage}
          className="bg-orange-400 hover:bg-orange-500 text-black"
        >
          <Send />
        </Button>
      </div>
    </div>
  );
}
