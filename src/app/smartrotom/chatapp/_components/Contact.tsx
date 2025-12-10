import { getSmartRotomUser, strToDate } from "@/lib/utils";
import { ChatData } from "../_types/Chat";
import {
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Image as ImageIcon,
  Video,
  Volume2,
  Smile,
  Sticker,
  FileText,
} from "lucide-react";

export function Contact({chat, activeChat, setActiveChat, session}: {chat: ChatData, activeChat: number, setActiveChat: (id: number) => void, session: any}) {
    return (
      <div>
        <div
          className={`${
            activeChat === chat.id ? "bg-neutral-700" : "bg-neutral-800"
          } hover:bg-neutral-700 h-[100px] flex items-center w-full hover:cursor-pointer`}
          onClick={() => setActiveChat(chat.id)}
        >
          <img
            src={chat.image}
            className="ml-2 rounded-full"
            width="50px"
            height="50px"
            alt="profile picture"
          />
          <div className="h-1/2  ml-4 text-neutral-50  flex flex-col justify-between items-start ">
            <p className="text-sm font-bold">{chat.name}</p>
            {LastMessage(chat, session)}
          </div>
          <div className="h-1/2  ml-auto mr-4 text-neutral-50 flex flex-col justify-between items-end ">
            <p className="text-sm">{strToDate(chat.messages[0]?.createdAt)}</p>
            {chat.unread > 0 && (
              <p className="flex items-center justify-center text-sm bg-primary-400  rounded-md w-6 h-6">
                {chat.unread}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function LastMessage(chat: ChatData, session: any) {
    let msg = chat?.messages[0] || null;
    if (!msg) return <p className="text-sm">No hay mensajes</p>;
    if (msg.type === "text" || msg.type === "chat")
      return (
        <p className="text-sm flex items-center">
          {msg.uuid === getSmartRotomUser(session).uuid ? (
            <ArrowUpRight
              className="mr-2 text-highlight-500"
              height={20}
              width={20}
              strokeWidth={2}
            />
          ) : (
            <ArrowDownLeft
              className="mr-2 text-red-500"
              height={20}
              width={20}
              strokeWidth={2}
            />
          )}

          <span>
            {chat?.messages[0]?.content.substring(0, 32) +
              (chat?.messages[0]?.content.length > 32 ? "..." : "")}
          </span>
        </p>
      );

    if (msg.type === "image")
      return (
        <p className="text-sm flex items-center">
          <ImageIcon
            className="mr-2 text-neutral-50"
            height={20}
            width={20}
            strokeWidth={2}
          />
          <span>Imagen</span>
        </p>
      );

    if (msg.type === "emoji")
      return (
        <p className="text-sm flex items-center">
          <Smile
            className="mr-2 text-neutral-50"
            height={20}
            width={20}
            strokeWidth={2}
          />
          <span>Emoji</span>
        </p>
      );

    if (msg.type === "sticker")
      return (
        <p className="text-sm flex items-center">
          <Sticker
            className="mr-2 text-neutral-50"
            height={20}
            width={20}
            strokeWidth={2}
          />
          <span>Sticker</span>
        </p>
      );

    if (msg.type === "document")
      return (
        <p className="text-sm flex items-center">
          <FileText
            className="mr-2 text-neutral-50"
            height={20}
            width={20}
            strokeWidth={2}
          />
          <span>Documento</span>
        </p>
      );

    if (msg.type === "video")
      return (
        <p className="text-sm flex items-center">
          <Video
            className="mr-2 text-neutral-50"
            height={20}
            width={20}
            strokeWidth={2}
          />
          <span>Video</span>
        </p>
      );

    if (msg.type === "audio")
      return (
        <p className="text-sm flex items-center">
          <Volume2
            className="mr-2 text-neutral-50"
            height={20}
            width={20}
            strokeWidth={2}
          />
          <span>Audio</span>
        </p>
      );

    if (msg.type === "call")
      return (
        <p className="text-sm flex items-center">
          <Phone
            className="mr-2 text-neutral-50"
            height={20}
            width={20}
            strokeWidth={2}
          />
          <span>Llamada de {msg.content} segundos</span>
        </p>
      );
  }