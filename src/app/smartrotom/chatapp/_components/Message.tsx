import { getSmartRotomUser, strToTime } from "@/lib/utils";
import { Message as MessageType } from "../_types/Chat";

export function parseSystemMessage(message: MessageType) {
  if (message.type === 'call') return `Llamada de ${message.content} segundos`;
  return message.content;
}

export function Message({ message, session, img = false, prev }: { message: MessageType, session: any, img?: boolean, prev: string }) {
  const isSender = message.uuid === getSmartRotomUser(session).uuid;
  const sender = message.uuid === 'system' ? 'system' : isSender ? 'user' : 'other';
  const content = message.uuid === 'system' ? parseSystemMessage(message) : message.content;
  const timestamp = strToTime(message.createdAt);

  return (
    <div
      className={`flex w-full max-w-xs ${sender === "user" ? "ml-auto justify-end" : "mr-auto justify-start"}`}
      key={message.id}
    >
      <div
        className={`border border-black  min-w-48 my-2 relative flex flex-col space-y-2 text-sm max-w-xs mx-2 px-3 py-1 rounded-xl ${sender === "system"
          ? "bg-main-200 text-main-900"
          : "bg-gradient-to-br from-orange-400 to-orange-500 text-black"
          }`}
      >
        {sender !== "user" && img && prev !== message.uuid && sender !== "system" ? (
          <img
            src={`https://crafatar.com/avatars/${message.uuid}`}
            alt={`profile picture for ${message.uuid}`}
            className='border-2 border-black w-10 h-10 rounded-full absolute -top-6 -left-4 bg-primary-400'
          />
        ) : null}
        <span className="break-words">{content}</span>
        <span
          className={`text-xs opacity-50 text-black`}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}