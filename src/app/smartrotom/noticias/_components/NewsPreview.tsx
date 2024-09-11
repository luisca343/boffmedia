import { InternalLink } from "@/components/nav/Link";
import { News } from "../page";
import { SmartRotomButton } from "@/components/smartrotom/ui/button";

export function MainNews({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="h-96 border-4 p-2 border-black bg-pink-400 flex flex-col justify-center items-center  hover:bg-pink-300">
                <p className="font-bold text-2xl">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`} className="w-full h-full flex flex-col justify-between p-4 bg-pink-400 border-4 border-black rounded-md  hover:bg-pink-300">
            <NeoBrutaImage src={news.image} alt="imagen de noticia" />
            <div className="flex flex-col justify-center text-center">
                <span className="px-2 py-1 text-2xl font-bold">{news.title}</span>
                <span className="px-2 py-1 text-xl">{news.subtitle}</span>
                <span className="px-2 py-1 text-xl">Hoy | Pueblo Mizu</span>
                <EditButtons id={slot} />
            </div>
        </InternalLink>
    );
}

export function BottomNews({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="h-96 border-4 bg-pink-400 flex flex-col justify-center items-center  hover:bg-pink-300">
                <p className="font-bold text-2xl">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.id}`} className="w-[22%] flex flex-col justify-between p-4 bg-pink-400 border-4 border-black hover:bg-pink-300">
            <NeoBrutaImage src={news.image} alt="imagen de noticia" />
            <p className="font-bold text-xl">{news.title}</p>
            <p className="text-lg">{news.subtitle}</p>
        </InternalLink>
    );
}

export function SideNewsWithPicture({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="border-4 p-2 m-2 border-black bg-pink-400 flex flex-col justify-center items-center  hover:bg-pink-300">
                <p className="font-bold text-2xl">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`}>
            <div className="flex flex-col p-2 m-2 bg-pink-400 border-4 border-black hover:bg-pink-300">
                <div className="flex justify-between pb-2">
                    <div className="w-full">
                        <p className="font-bold text-xl">{news.title}</p>
                        <p className="text-lg">{news.subtitle}</p>
                    </div>
                    <div className="w-32 h-24">
                        <NeoBrutaImage src={news.image} alt="imagen de noticia" className="h-24 w-32" />
                    </div>
                </div>
                <EditButtons id={slot} size="sm" />
            </div>
        </InternalLink>
    );
}

export function SideNews({ news, slot }: { news: News, slot: number }) {
    if (!news) {
        return (
            <div className="h-96 border-4 p-2 border-black bg-pink-400 flex flex-col justify-center items-center">
                <p className="font-bold text-2xl">No hay noticias</p>
                <EditButtons id={slot} />
            </div>
        );
    }
    return (
        <InternalLink href={`/noticias/leer/${news.newsId}`}>
            <div className="h-[25%] p-2 border-4 border-black bg-purple-300 hover:bg-pink-200">
                <p className="font-bold text-xl">{news.title}</p>
                <p className="text-lg">{news.subtitle}</p>
                <EditButtons id={slot} size="sm" />
            </div>
        </InternalLink>
    );
}

export function NeoBrutaImage({ src, alt, className }: { src: string | undefined, alt: string, className?: string }) {
    return (
        <img
            className={`border-4 border-black bg-pink-500 overflow-hidden rounded-none h-full w-full ${className}`}
            src={src || '/smartrotom/img/apps/noticias/default.webp'}
            alt={alt}
        />
    );
}

export function EditButtons({ id, size = 'default' }: { id: number, size?: 'default' | 'sm' | 'lg' | 'icon' }) {
    return (
        <div className="flex justify-end self-end">
            <InternalLink href={`/noticias/editar/${id}`}>
                <SmartRotomButton variant='furret' size={size} className="mr-2">
                    Editar
                </SmartRotomButton>
            </InternalLink>
            <InternalLink href={`/noticias/cambiar/${id}`}>
                <SmartRotomButton variant='furret' size={size} className="ml-2">
                    Cambiar
                </SmartRotomButton>
            </InternalLink>
        </div>
    );
}


