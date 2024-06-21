import { InternalLink } from "@/components/nav/Link"
import { News } from "../page"
import { Inter } from "next/font/google"

export function MainNews({news}: {news: News}){

    return (
        <InternalLink href={`/noticias/leer/${news.id}`} className="w-full h-96 flex justify-between border-b p-2 border-gray-200 hover:bg-gray-100">
            <div className="flex flex-col justify-center">
                <span className="px-2 py-1 text-2xl font-bold">{news.title}</span>
                <span className="px-2 py-1 text-1xl">{news.subtitle}</span>
                <span className="px-2 py-1 text-1xl">Hoy | Pueblo Mizu</span>
            </div>
            <img className="w-full" src={news.image} alt="imagen de noticia" />
        </InternalLink>
    )
}


export function BottomNews({news}: {news: News}){

    return (
        <InternalLink href={`/noticias/leer/${news.id}`} className="w-[25%] flex flex-col justify-between p-1  hover:bg-gray-100">
            <img className="h-[150px] mx-auto" src={news.image} alt="imagen de noticia" />
            <p className="font-bold">{news.title}</p>
            <p>{news.subtitle}</p>
        </InternalLink>
    )
}

export function SideNewsWithPicture({news}: {news: News}){
    return (
        <div className="h-96 border-b p-2 border-gray-200  hover:bg-gray-100">
            <img className="h-[50%] mx-auto" src={news.image} alt="imagen de noticia" />
            <InternalLink href={`/noticias/leer/${news.id}`} className="h-[25%]">
            <p className="font-bold">{news.title}</p>
            <p>{news.subtitle}</p>
         </InternalLink> 
        </div>
    )
}

export function SideNews({news}: {news: News}){
    return (
        <InternalLink href={`/noticias/leer/${news.id}`} className="h-[25%] p-2  hover:bg-gray-100">
        <p className="font-bold">{news.title}</p>
        <p>{news.subtitle}</p>
    </InternalLink>
    )
}
