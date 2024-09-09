import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { parseDate } from "@/lib/utils";
import { SmartRotomAchievement } from "../_types/Achievement";
import { BookLink } from "@/components/ui/book/book";


export default function Badges({achievementData, book}: {achievementData: SmartRotomAchievement[], book: any}){
    if(!achievementData) return null

    const badges: { id: string; }[] = []
    achievementData.forEach((achievement)=>{
        if(achievement.category === 'Gimnasios'){
            badges.push(achievement)
        }
    })

    const principiantes = achievementData.filter((a)=>a.subcategory === 'Principiantes-N' || a.subcategory === 'Principiantes-F')
    const fukitsuGansolia = achievementData.filter((a)=>a.subcategory === 'Fukitsu-Gansolia')
    const narukamiAkina = achievementData.filter((a)=>a.subcategory === 'Narukami-Akina')
    const ligas = achievementData.filter((a)=>a.category === 'Ligas')
    const frenteBatalla = achievementData.filter((a)=>a.category === 'Frente Batalla')

    const completedPrincipiantes = principiantes.filter((a)=>a.completed)
    const completedFukitsuGansolia = fukitsuGansolia.filter((a)=>a.completed)
    const completedNarukamiAkina = narukamiAkina.filter((a)=>a.completed)
    const completedLigas = ligas.filter((a)=>a.completed)
    const completedFrenteBatalla = frenteBatalla.filter((a)=>a.completed)

    return(
        <div className="flex flex-col p-2">
            <div className="flex flex-col mb-4 2xl:mb-8">
                <span className="font-bold text-2xl mb-4"> Circuito de Principiantes [{completedPrincipiantes.length}/{principiantes.length}]</span>
                <div className="flex flex-row">
                    {principiantes.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            <div className="flex flex-col mb-4 2xl:mb-8">
                <span className="font-bold text-2xl mb-4">Circuito de Fukitsu-Gansolia [{completedFukitsuGansolia.length}/{fukitsuGansolia.length}]</span>
                <div className="flex flex-row">
                    {fukitsuGansolia.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            <div className="flex flex-col mb-4 2xl:mb-8">
                <span className="font-bold text-2xl mb-4">Circuito de  Narukami-Akina [{completedNarukamiAkina.length}/{narukamiAkina.length}]</span>
                <div className="flex flex-row">
                    {narukamiAkina.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            <div className="flex flex-col mb-4 2xl:mb-8">
                <span className="font-bold text-2xl mb-4">Ligas [{completedLigas.length}/{ligas.length}]</span>
                <div className="flex flex-row">
                    {ligas.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            <div className="flex flex-col mb-4 2xl:mb-8">
                <span className="font-bold text-2xl mb-4">Frente Batalla [{completedFrenteBatalla.length}/{frenteBatalla.length}]</span>
                <div className="flex flex-row">
                    {frenteBatalla.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            
        </div>
    )


// If not obtained use filter: brightness(0)
function Badge({data}: {data: SmartRotomAchievement}){
    return(
        <HoverCard >
            <BookLink book={book} page={data.completed ? 5 + getBadgeIndex(data) : 4} className={`flex flex-row w-full justify-around hover:cursor-pointer hover:scale-110 `}>
                <HoverCardTrigger>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                    src={`https://api.boffmedia.es/smartrotom/img/logros/${data.icon}.webp`} 
                    alt={data.name} 
                    className={`w-12 h-12 2xl:h-16 2xl:w-16 ${data.completed ? '' : 'filter brightness-0'} pointer-events-none`}
                    />
                </HoverCardTrigger>
            </BookLink>
            <HoverCardContent variant="paper" align="start" className="absolute z-50">
                <div className="flex flex-col">
                    <span className="font-bold text-xl">{data.name}</span>
                    <span>{data.description}</span>
                    <span>{data.completed ? `Obtenida: ${parseDate(data.completedAt)}` : 'No completado'}</span>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}

function getBadgeIndex(badge: SmartRotomAchievement){
    for(let i = 0; i < badges.length; i++){
        if(badges[i].id === badge.id) return i
    }
    return -1
}

}
