import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface SmartRotomAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    subcategory: string;
    target: number;
    progress: number;
    completed: boolean;
    completedAt: Date;
    uuid: string;
}

export default function Badges({achievementData}: {achievementData: SmartRotomAchievement[]}){
    if(!achievementData) return null
    const principiantes = achievementData.filter((a)=>a.subcategory === 'Principiantes-N' || a.subcategory === 'Principiantes-F')
    const fukitsuGansolia = achievementData.filter((a)=>a.subcategory === 'Fukitsu-Gansolia')
    const narukamiAkina = achievementData.filter((a)=>a.subcategory === 'Narukami-Akina')
    const ligas = achievementData.filter((a)=>a.category === 'Ligas')

    const completedPrincipiantes = principiantes.filter((a)=>a.completed)
    const completedFukitsuGansolia = fukitsuGansolia.filter((a)=>a.completed)
    const completedNarukamiAkina = narukamiAkina.filter((a)=>a.completed)
    const completedLigas = ligas.filter((a)=>a.completed)

    return(
        <div className="flex flex-col p-2">
            <div className="flex flex-col mb-4">
                <span className="font-bold text-2xl mb-2"> Circuito de Principiantes [{completedPrincipiantes.length}/{principiantes.length}]</span>
                <div className="flex flex-row">
                    {principiantes.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            <div className="flex flex-col mb-4">
                <span className="font-bold text-2xl mb-2">Circuito de Fukitsu-Gansolia [{completedFukitsuGansolia.length}/{fukitsuGansolia.length}]</span>
                <div className="flex flex-row">
                    {fukitsuGansolia.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            <div className="flex flex-col mb-4">
                <span className="font-bold text-2xl mb-2">Circuito de  Narukami-Akina [{completedNarukamiAkina.length}/{narukamiAkina.length}]</span>
                <div className="flex flex-row">
                    {narukamiAkina.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            <div className="flex flex-col mb-4">
                <span className="font-bold text-2xl mb-2">Ligas [{completedLigas.length}/{ligas.length}]</span>
                <div className="flex flex-row">
                    {ligas.map((a)=><Badge key={a.id} data={a} />)}
                </div>
            </div>
            
        </div>
    )
}

// If not obtained use filter: brightness(0)
function Badge({data}: {data: SmartRotomAchievement}){
    return(
        <HoverCard >
            <HoverCardTrigger className="flex flex-row w-full justify-around">
                <img src={`https://api.boffmedia.es/smartrotom/img/logros/${data.icon}.webp`} alt={data.name} 
                        className={`h-12 w-12 ${data.completed ? '' : 'filter brightness-0'}`}
                    />
            </HoverCardTrigger>
            <HoverCardContent variant="paper" align="start" className="absolute z-50">
                <div className="flex flex-col">
                    <span className="font-bold text-xl">{data.name}</span>
                    <span>{data.description}</span>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}