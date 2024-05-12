import { getSmartRotomUser, strToDate, strToTime } from "@/lib/utils";

type Message = {
    id: number;
    content: string;
    createdAt: string;
    uuid: string;
    chatId: number;
}


export function Message({message, session, img=false, prev} : {message: Message, session: any, img?: boolean, prev: string}){
    const isSender = message.uuid === getSmartRotomUser(session).uuid;
    return(
    <div className={`border-2 font-bold border-black mx-6 my-1 bg-primary-400 text-black p-1 pt-3  max-w-[50%] ${isSender ? 'self-end' : 'self-start'} relative rounded-lg`} key={message.id}>
        {!isSender && img && prev !== message.uuid ? <img src={`https://crafatar.com/avatars/${message.uuid}`} 
        alt={`profile picture for ${message.uuid}`} className='border-2 border-black w-10 h-10 rounded-full absolute -top-6 -left-4 bg-primary-400'/> : null}
        <div>{message.content}</div>
        <div className="pl-8 text-end text-[10px] font-normal">{strToTime(message.createdAt)}</div>
    </div>
    )
}

