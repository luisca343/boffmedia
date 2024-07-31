'use client'
import { Book, BookLink, Page, PageTitle, turnPage } from "@/components/ui/book/book";
import './pasaporte.css'
import { useSession } from "next-auth/react";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { useEffect, useState } from "react";
import { rotomPOST } from "@/services/boffAPI";
import ActiveTeam from "./_components/ActiveTeam";
import useTranslation from 'next-translate/useTranslation'
import Badges from "./_components/Badges";
import { SmartRotomAchievement, parseAchievementData } from "./types";
import { parseDate } from "@/lib/utils";

export default function Pasaporte(){
  const [book, setBook] = useState(null) as any
  const {data: session} = useSession() as {data: BoffSession | null, status: string};
  const uuid = session?.user.smartRotomUser.uuid as string
  const username = session?.user.smartRotomUser.username as string
  const { t: movesTrans } = useTranslation("smartrotom/pokedex/moves")

  const [stats, setStats] = useState(null) as any
  const [team,setTeam] = useState(null) as any
  const [ achievements, setAchievements] = useState([] as SmartRotomAchievement[])

  const obtainedBadges = achievements.filter((achievement: SmartRotomAchievement)=>achievement.completed && achievement.category === 'Gimnasios').length

  useEffect(()=>{
    console.log('uuid',uuid)
    rotomPOST('/stats',{uuid}).then((res)=>{
      setStats(res)
    })
    rotomPOST('/team',{uuid}).then((res)=>{
      setTeam(res)
    })
    rotomPOST('/achievements',{uuid}).then((res)=>{
      console.log('achievements',res)
      setAchievements(res)
    })
  },[])

  let page  = 0;
  let badgePage = 4
    return(
      <section className=" bg-yellow-200 flex bg-center bg-no-repeat bg-fixed bg-cover">
          <Book setBook={setBook}>
            <Page dataDensity="hard" book={book} number={page++} className="font-vinque bg-blue-600 flex  flex-col " style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
              <div className="text-center text-6xl mt-4 text-yellow-200 font-bold opacity-80" style={{ mixBlendMode: 'normal' }}>PASAPORTE</div>
              <img className="h-0 flex-1  opacity-80" src="/smartrotom/img/logo.webp" alt="description" style={{ mixBlendMode: 'normal' }} />
              <div className="mb-4 text-center text-4xl  text-yellow-200 font-bold  opacity-80" style={{ mixBlendMode: 'normal' }}>Región de Teras</div>
            </Page>
            <Page book={book} number={page++} >
              <PageTitle title="Indice"/>
              <div className="flex flex-col justify-start items-start w-full py-4 px-8">
                <BookLink book={book} page={1}  className="text-2xl font-bold">1. Índice</BookLink>
                <BookLink book={book} page={2}  className="text-2xl font-bold">2. Datos Jugador</BookLink>
                <BookLink book={book} page={3}  className="text-2xl font-bold">3. Equipo Actual</BookLink>
                <BookLink book={book} page={badgePage}  className="text-2xl font-bold">4. Medallas</BookLink>
                <div className="ml-6 flex">
                {
                  achievements && achievements.map((achievement: any, index)=>{
                    if(achievement.completed === 1 && achievement.category === 'Gimnasios'){
                      const page  = ++badgePage
                      return <BookLink className="mr-2 font-bold" key={achievement.name} book={book} page={page}>{page}. {achievement.name}</BookLink>
                    }
                  }
                  )
                }
                </div>
                <BookLink book={book} page={5 + obtainedBadges}  className="text-2xl font-bold">{5 + obtainedBadges}. Logros</BookLink>

              </div>
            </Page>
            <Page book={book} number={page++} >
              <div className="flex flex-col">
                <PageTitle title="Datos Jugador"/>
                <div className="flex">
                  <div style={{width:'150px'}}>
                    <img src={`https://crafatar.com/renders/body/${uuid}?overlay`} alt="description" />
                  </div>
                  <span className="text-xl font-bold">{username}</span>
                </div>
                
               
              </div>
            </Page>
            <Page book={book} number={page++} >
              <PageTitle title="Equipo Actual"/>
              {team && <ActiveTeam team={team} />}
            </Page>
            <Page book={book} number={page++} >
              <PageTitle title="Medallas"/>
              <Badges book={book} achievementData={achievements}></Badges>
            </Page>
            {
              achievements && achievements.map((achievement: SmartRotomAchievement)=>{
                if(achievement.completed && achievement.category === 'Gimnasios'){
                  const data = parseAchievementData(achievement.data)
                  const team = data.team
                  return <Page key={achievement.name} book={book} number={page++} >
                    <BadgePageTitle title={achievement.name} achievement={achievement} />
                    <div className="flex-1"><ActiveTeam team={team} className="h-[95%]"/></div>
                  </Page>
                }
              })
            }
            <Page dataDensity="hard" book={book} number={page++}  style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
            </Page>
          </Book>
      </section>
    )


 

    function BadgePageTitle({title, achievement}: {title: string, achievement : SmartRotomAchievement}){
      return <div className="flex font-bold 2xl:m-2 font-vinque  justify-between items-end">
        <div className="flex">
          <img className="w-8 2xl:w-12 mr-2" src={`https://api.boffmedia.es/smartrotom/img/logros/${achievement.icon}.webp`} alt={achievement.icon} />
          <span className="underline text-2xl 2xl:text-4xl ">{title}</span>
        </div>
        <span className="right-0 text-xl 2xl:text-2xl">Obtenida: {parseDate(achievement.completedAt)}</span>
      </div>
    }
}