"use client"
import { InternalLink } from "@/components/nav/Link"
import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SmartRotomButton } from "@/components/smartrotom/ui/button"
import { useBoffSession } from "@/services/useBoffSession"

export default  function EditarNoticia(){
    const [news, setNews] = useState([])
    const { session } = useBoffSession();
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