import { getSmartRotomUser, strToDate, strToTime } from "@/lib/utils";

type Message = {
    id: number;
    content: string;
    createdAt: string;
    uuid: string;
    chatId: number;
}


export function Message({message, session, img=false} : {message: Message, session: any, img?: boolean}) {
    const isSender = message.uuid === getSmartRotomUser(session).uuid;
    if(!isSender && img) return (

            <div className={`mx-8 my-1 bg-primary-400 pt-4 p-2 max-w-[50%] ${isSender ? 'self-end' :null} relative rounded-sm`} key={message.id}>
            <img src='https://db.pokemongohub.net/_next/image?url=%2Fimages%2Fofficial%2Ffull%2F363.webp&w=640&q=75' alt='profile picture' className='w-8 h-8 rounded-full' className='w-16 h-16 rounded-full absolute -top-12 -left-8 bg-primary-400'/>
            <div >{message.content}</div>
            <div  className="pl-8 text-end text-[10px]">{strToTime(message.createdAt)}</div>
    </div>
)

    return(
        <div className={`mx-4 my-1 bg-primary-400 p-2 pr-4 max-w-[50%] ${isSender ? 'self-end' :null} rounded-sm`} key={message.id}>
            <div className="pr-8">{message.content}</div>
            <div  className="text-end text-[10px]">{strToTime(message.createdAt)}</div>
        </div>
    )
}

