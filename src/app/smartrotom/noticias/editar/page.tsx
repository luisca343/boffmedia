"use client"
import { InternalLink } from "@/components/nav/Link"
import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SmartRotomButton } from "@/components/smartrotom/ui/button"
import FurretNav from "../_components/FurretNav"

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
        <div className="bg-pink-200 text-black lexend-mega">
            <FurretNav />
            <div className="flex flex-wrap  space-x-4 space-y-2">
                <SmartRotomButton  size='lg' onClick={() => createNote()} className="mt-2 ml-4">
                    <h2>Crear</h2>
                </SmartRotomButton>
                {news.map((n: any) => (
                    <InternalLink key={n.id} href={`/noticias/editar/${n.id}`}>
                        <SmartRotomButton variant='furret' size='lg'>{n.title}</SmartRotomButton>
                    </InternalLink>
                ))}
            </div>
        </div>
    )
}