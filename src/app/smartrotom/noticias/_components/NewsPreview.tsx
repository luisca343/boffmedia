import { InternalLink } from "@/components/nav/Link"
import { News } from "../page"
import { Inter } from "next/font/google"

export function MainNews({news, slot}: {news: News, slot: number}){
    if(!news) {
        return <div className="h-96 border-b p-2 border-gray-200">
            <p className="font-bold">No hay noticias</p>
            <EditButtons id={slot} />
        </div>
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`} className="w-full h-96 flex justify-between border-b p-2 border-gray-200 hover:bg-gray-100">
                <div className="flex flex-col justify-center">
                    <span className="px-2 py-1 text-2xl font-bold">{news.title}</span>
                    <span className="px-2 py-1 text-1xl">{news.subtitle}</span>
                    <span className="px-2 py-1 text-1xl">Hoy | Pueblo Mizu</span>
                    <EditButtons id={slot} />
                </div>
                <img className="w-full" src={news.image} alt="imagen de noticia" />
        </InternalLink>
    )
}


export function BottomNews({news, slot}: {news: News, slot: number}){

    if(!news){
        return <div className="h-96 border-b p-2 border-gray-200">
            <p className="font-bold">No hay noticias</p>
            <EditButtons id={slot} />
        </div>
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`} className="w-[25%] flex flex-col justify-between p-1  hover:bg-gray-100">
            <img className="h-[150px] mx-auto" src={news.image} alt="imagen de noticia" />
            <p className="font-bold">{news.title}</p>
            <p>{news.subtitle}</p>
            <EditButtons id={slot} />
        </InternalLink>
    )
}

export function SideNewsWithPicture({news, slot}: {news: News, slot: number}){
    if(!news){
        return <div className="h-96 border-b p-2 border-gray-200">
            <p className="font-bold">No hay noticias</p>
            <EditButtons id={slot} />
        </div>
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`}>
        <div className="h-96 border-b p-2 border-gray-200  hover:bg-gray-100">
            <img className="h-[50%] mx-auto" src={news.image} alt="imagen de noticia" />
            <div  className="h-[25%]">
                <p className="font-bold">{news.title}</p>
                <p>{news.subtitle}</p>
                <EditButtons id={slot} />
            </div> 
        </div>
    </InternalLink>
    )
}

export function SideNews({news, slot}: {news: News, slot: number}){
    if(!news){
        return <div className="h-96 border-b p-2 border-gray-200">
            <p className="font-bold">No hay noticias</p>
            <EditButtons id={slot} />
        </div>
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`}>
            <div className=" h-[25%] p-2 hover:bg-gray-100">
            <p className="font-bold">{news.title}</p>
            <p>{news.subtitle}</p>
            <EditButtons id={slot} />
        </div>
    </InternalLink>
    )
}


export function EditButtons({id}: {id: number}){
    return (
        <div className="flex justify-end self-end ">
            <InternalLink className="mx-2" href={`/noticias/editar/${id}`}>Editar</InternalLink>
            <InternalLink className="mx-2" href={`/noticias/cambiar/${id}`}>Cambiar</InternalLink>
        </div>
    )
}