"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { all } from "axios"
import { useState } from "react"
import { News } from "../ordenar/page"
import { Button } from "@/components/ui/button"
import { rotomPOST } from "@/services/boffAPI"
import { useRouter } from "next/navigation";

export default function NewsSelect({news, allnews, slotId}: {news: News[], allnews: any,slotId: number}){
    const newsItem = news.find(n => n.id === slotId)
    console.log(newsItem)

    const [selected, setSelected] = useState(newsItem?.newsId)
    const [subtitle, setSubtitle] = useState(newsItem?.subtitle)
    const [image, setImage] = useState(newsItem?.image)
    const router = useRouter();

    function saveNews(){
        rotomPOST("/documents/activeNews", {id: slotId, newsId: selected, newsData: {subtitle, image}})
            .then(() => {
                router.back()
            })
    }

    return(
        <div>
            NOTICIA NUMERO {slotId}
            <Select onValueChange={(e) => {
                setSelected(parseInt(e))
            }} >
                <SelectTrigger>{allnews.find(n => n.id === selected)?.title}</SelectTrigger>
                <SelectContent>
                    {allnews.map(n => (
                        <SelectItem key={n.id} value={n.id+""}>{n.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            <Input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            <Input type="text" value={image} onChange={(e) => setImage(e.target.value)} />


            <Button onClick={() => saveNews()}>Guardar</Button>
        </div>
    )
}