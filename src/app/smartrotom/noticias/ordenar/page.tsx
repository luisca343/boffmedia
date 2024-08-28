import { InternalLink } from "@/components/nav/Link";
import { BottomNews, MainNews, SideNews, SideNewsWithPicture } from "../_components/NewsPreview";
import { rotomGET } from "@/services/boffAPI";

export interface News {
    id: number
    newsId: number
    title: string
    subtitle: string
    image?: string
    date?: string
    
}



export default async function OrdenarNoticias(){
    const news = await rotomGET("/documents/activeNews") as News[]
    return (
        <div>
            <nav className="h-12 bg-pink-600 flex items-center">
                LOGO AQUÍ SUPONGO
                <InternalLink href="/noticias/ordenar">Ordenar</InternalLink>
                <InternalLink href="/noticias/editar">Editar</InternalLink>
            </nav>
            <div className="w-[75%] m-auto text-4xl font-bold mt-4 border-b-2 border-pink-600">HOY</div>
            <div className="flex w-[75%] m-auto">
                <div className="flex w-[80%] flex-col border-b border-main-200 p-2">
                    <MainNews news={news[0]} slot={0}/>
                    <div className="w-full flex justify-between   p-2">
                        <BottomNews news={news[1]} slot={1}/>
                        <BottomNews news={news[2]} slot={2}/>
                        <BottomNews news={news[3]} slot={3}/>
                        <BottomNews news={news[4]} slot={4}/>
                    </div>
                </div>
                <div className="w-[25%]  p-2 border-b border-main-200 ">
                    <SideNewsWithPicture news={news[5]} slot={5}/>
                    <SideNews news={news[6]} slot={6}/>
                    <SideNews news={news[7]} slot={7}/>
                </div>
            </div>
        </div>
    )
}

