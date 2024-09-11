import { InternalLink } from "@/components/nav/Link";
import { News } from "../page";
import { Inter } from "next/font/google";
import { SmartRotomButton } from "@/components/smartrotom/ui/button";

export function MainNews({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="h-96 border-4 p-2 border-black overflow-hidden">
                <p className="font-bold">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`} className=" w-full h-full flex flex-col justify-between p-4  rounded-md">
            <NeoBrutaImage src={news.image} alt="imagen de noticia" />
            
            <div className="flex flex-col justify-center text-center">
                <span className="px-2 py-1 text-2xl font-bold">{news.title}</span>
                <span className="px-2 py-1 text-1xl">{news.subtitle}</span>
                <span className="px-2 py-1 text-1xl">Hoy | Pueblo Mizu</span>
                <EditButtons id={slot} />
            </div>
        </InternalLink>
    );
}

export function BottomNews({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="h-96 border-4">
                <p className="font-bold">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`} className="w-[22%] flex flex-col justify-between hover:bg-pink-200  p-4">
            <NeoBrutaImage src={news.image} alt="imagen de noticia" />
            <p className="font-bold">{news.title}</p>
            <p>{news.subtitle}</p>
        </InternalLink>
    );
}

export function SideNewsWithPicture({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="h-96 border-4 p-2 border-black">
                <p className="font-bold">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`}>
            <div className="flex flex-col p-2 ">
                <div className="flex space-between  pb-2">
                    <div className="w-full">
                        <p className="font-bold">{news.title}</p>
                        <p>{news.subtitle}</p>
                    </div>
                    <div className="w-32 h-24 ">
                        <NeoBrutaImage src={news.image} alt="imagen de noticia" className="h-24 w-32"/>
                    </div>
                    
                </div>
                <EditButtons id={slot}  size="sm"/>
            </div>
        </InternalLink>
    );
}

export function SideNews({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="h-96 border-4 p-2 border-black">
                <p className="font-bold">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`}>
            <div className="h-[25%] p-2 border-4 border-black hover:bg-pink-200 ">
                <p className="font-bold">{news.title}</p>
                <p>{news.subtitle}</p>
                <EditButtons id={slot} size="sm"/>
            </div>
        </InternalLink>
    );
}

export function NeoBrutaImage({ src, alt, className }: { src: string | undefined, alt: string, className?: string }) {
    return (
        <div className={`animate-all bg-pink-500 overflow-hidden pr-1 pb-1  aspect-auto m-auto border-2 border-black shadow-dark rounded-md ${className}`}>
            <img className={`border-r-2 border-b-2 border-black bg-pink-500 overflow-hidden rounded-tr-md rounded-br-md h-full w-full`}
                src={src || '/smartrotom/img/apps/noticias/default.webp'} 
                alt={alt} />
        </div>
    );
}

export function EditButtons({ id, size = 'default' }: { id: number, size?: 'default' | 'sm' | 'lg' | 'icon' }) {
    return (
        <div className="flex justify-end self-end">
            <InternalLink href={`/noticias/editar/${id}`} >
                <SmartRotomButton variant='furret' size={size} className="mx-2 text-black font-bold border-2 border-black p-1 hover:bg-pink-200">
                    Editar
                </SmartRotomButton>
            </InternalLink>
            <InternalLink href={`/noticias/cambiar/${id}`} >
                <SmartRotomButton variant='furret' size={size} className="mx-2 text-black font-bold border-2 border-black p-1 hover:bg-pink-200">
                    Cambiar
                </SmartRotomButton>
            </InternalLink>
        </div>
    );
}