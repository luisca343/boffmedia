"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { all } from "axios"
import { JSXElementConstructor, Key, PromiseLikeOfReactNode, ReactElement, ReactNode, ReactPortal, useState } from "react"
import { News } from "../ordenar/page"
import { Button } from "@/components/ui/button"
import { rotomPOST } from "@/services/boffAPI"
import { useRouter } from "next/navigation";
import { relativeRedirect } from "@/lib/utils"

export default function NewsSelect({news, allnews, slotId}: {news: News[], allnews: any,slotId: number}){
    const newsItem = news.find(n => n.id === slotId)
    console.log(newsItem)

    const [selected, setSelected] = useState(newsItem?.newsId)
    const [subtitle, setSubtitle] = useState(newsItem?.subtitle)
    const [image, setImage] = useState(newsItem?.image)
    const router = useRouter();

    function saveNews(){
        rotomPOST("/documents/activeNews", {id: slotId, newsId: selected, newsData: {subtitle, image}})
            .then((data) => {
                console.log(data)
                relativeRedirect(router, "/noticias")
            })
    }

    return(
        <div className="w-full h-full bg-pink-200 lexend-mega">
            <section className="w-[80%] m-auto p-4 border-b-4 border-black">
                <h1 className="text-4xl font-bold mb-4">{slotId === 1 ? "Noticia Principal" : `Noticia lateral ${slotId - 1}`}</h1>
                <Select onValueChange={(e) => {
                    setSelected(parseInt(e))
                }} >
                    <SelectTrigger className="bg-pink-400 text-black border-b-2 border-black p-2 mb-4">{allnews.find((n: { id: number | undefined }) => n.id === selected)?.title}</SelectTrigger>
                    <SelectContent className="bg-pink-400 text-black border-b-2 border-black">
                        {allnews.map((n: { id: Key | null | undefined; title: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | PromiseLikeOfReactNode | null | undefined }) => (
                            <SelectItem key={n.id} value={n.id+""} className="p-2 lexend-mega">{n.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                <Input placeholder="Subtítulo" type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="bg-pink-400 text-black border-b-2 border-black p-2 mb-4" />
                <Input placeholder="Imagen" type="text" value={image} onChange={(e) => setImage(e.target.value)} className="bg-pink-400 text-black border-b-2 border-black p-2 mb-4" />

                <Button onClick={() => saveNews()} className="bg-pink-400 text-black border-b-2 border-black p-2">Guardar</Button>
            </section>
        </div>
    )
}