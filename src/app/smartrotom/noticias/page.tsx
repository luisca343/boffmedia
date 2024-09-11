import { InternalLink } from "@/components/nav/Link";
import { BottomNews, MainNews, SideNews, SideNewsWithPicture } from "./_components/NewsPreview";
import { rotomGET } from "@/services/boffAPI";

export interface News {
    id: number
    newsId: number
    title: string
    subtitle: string
    image?: string
    date?: string
}

export default async function NoticieroFurretToday(){
    const news = await rotomGET("/documents/activeNews") as News[]
    const allNews = await rotomGET("/documents/news") as News[]

    return (
        <div className="bg-pink-100 text-black lexend-mega">
            <nav className="h-12 bg-pink-500 flex items-center border-b-4 border-black">
                <div className="font-bold text-xl ml-4">LOGO AQUÍ SUPONGO</div>
                <InternalLink href="/noticias/ordenar" className="ml-4 text-black font-bold">Ordenar</InternalLink>
                <InternalLink href="/noticias/editar" className="ml-4 text-black font-bold">Editar</InternalLink>
            </nav>
            <div className="w-[80%] m-auto text-4xl font-bold mt-4 border-b-4 border-black">TENDENCIAS</div>
            <section className="flex w-[80%] flex-col m-auto mt-4 justify-center">
                <div className="flex justify-around p-4 overflow-hidden">
                    <div className="w-[60%]">
                        <MainNews news={news[0]} slot={1}/>
                    </div>
                    <div className="w-[30%] flex flex-col justify-around">
                        <SideNewsWithPicture news={news[5]} slot={2} />
                        <SideNewsWithPicture news={news[6]} slot={3}/>
                        <SideNewsWithPicture news={news[7]} slot={4} />
                    </div>
                </div>
            </section>
                <div className="w-[80%] m-auto text-4xl font-bold mt-4 border-b-4 border-black">Otras Noticias</div>
                    <div className="w-[80%] m-auto flex justify-between mt-4">
                        <BottomNews news={news[1]} slot={5}/>
                        <BottomNews news={news[2]} slot={6}/>
                        <BottomNews news={news[3]} slot={7}/>
                        <BottomNews news={news[4]} slot={8} />
                </div>
        </div>
    )





}