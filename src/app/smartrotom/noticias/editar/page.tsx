"use client"
import { InternalLink } from "@/components/nav/Link"
import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default  function EditarNoticia(){
    const [news, setNews] = useState([])
    const {data: session} = useSession() as any
    const router = useRouter()

    useEffect(() => {
        rotomGET(`/documents/news`)
            .then((res) => {
                setNews(res)
            }
        )
    }, [news])


    function createNote() {
        rotomPOST(`/documents/create`, {title: "BIG NEWS", content: "", type: 1, userUuid: session?.user.smartRotomUser?.uuid})
            .then((res) => {
                if(res.id){
                    router.push(`/smartrotom/noticias/editar/${res.id}`)
                }
            }
        )
    }

    return (
        <div>
            <h1>Editar Noticia</h1>
            <p>Selecciona una noticia para editar</p>
            <div className="flex flex-wrap">
                <button onClick={() => createNote()} className="text-main-50 bg-main-700 p-2 rounded-lg m-2 hover:bg-main-500 w-[300px] text-center flex flex-col justify-center items-center">
                    <h2>Crear</h2>
                </button>
                {news.map((n: any) => (
                    <InternalLink key={n.id} href={`/noticias/editar/${n.id}`} className="flex flex-col w-36 items-center border border-black hover:text-main-500">
                        <img src={`https://t3.ftcdn.net/jpg/04/60/01/36/360_F_460013622_6xF8uN6ubMvLx0tAJECBHfKPoNOR5cRa.jpg` } alt="imagen de noticia" />
                        <h2>{n.title}</h2>
                    </InternalLink>
                ))}
            </div>
        </div>
    )
}