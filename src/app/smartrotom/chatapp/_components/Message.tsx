import { getSmartRotomUser, strToDate, strToTime } from "@/lib/utils";
import { parse } from "path";
import { Message as MessageType } from "../_types/Chat";

export function parseSystemMessage(message: MessageType){
    if(message.type === 'call') return `Llamada de ${message.content} segundos`

    return message.content
}

export function Message({message, session, img=false, prev} : {message: MessageType, session: any, img?: boolean, prev: string}){
    const isSender = message.uuid === getSmartRotomUser(session).uuid;
    if(message.uuid === 'system') return(
        <div className="text-center text-[10px] font-normal self-center bg-primary-400 text-black p-1 max-w-[50%] rounded-lg border border-black mb-2" key={message.id}>
            {parseSystemMessage(message)}
        </div>
    )
    return(
    <div className={`border-2 font-bold border-black mx-6 my-1 bg-primary-400 text-black p-1 pt-3  max-w-[50%] ${isSender ? 'self-end' : 'self-start'} relative rounded-lg break-words`} key={message.id}>
        {!isSender && img && prev !== message.uuid ? <img src={`https://crafatar.com/avatars/${message.uuid}`} 
        alt={`profile picture for ${message.uuid}`} className='border-2 border-black w-10 h-10 rounded-full absolute -top-6 -left-4 bg-primary-400'/> : null}
        <div>{message.content}</div>
        <div className="pl-8 text-end text-[10px] font-normal">{strToTime(message.createdAt)}</div>
    </div>
    )
}

