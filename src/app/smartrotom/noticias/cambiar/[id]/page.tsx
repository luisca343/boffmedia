import { rotomGET } from "@/services/boffAPI"
import { Select, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { SelectContent } from "@radix-ui/react-select"

export default async function CambiarNoticia({params}: {params: {id: string}}){
    console.log("EL PARAM ES;"+ params.id)
    const id = params.id
    /*
    const news = await rotomGET("/documents/activeNews") as News[]
    const allnews = await rotomGET("/documents/news") as News[]*/
    
    return (
        <div>
            {/*<NewsSelect allnews={allnews}  news={news} slotId={parseInt(id)}/>*/}
        </div>
    )
}