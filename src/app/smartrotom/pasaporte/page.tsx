'use client'
import { Book, Page, PageFlip, turnPage } from "@/components/ui/book/book";
import './pasaporte.css'
import { useSession } from "next-auth/react";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { CabezaJugador } from "@/components/smartrotom/CabezaMC";
import { useEffect, useState } from "react";
import { rotomPOST } from "@/services/boffAPI";
import ActiveTeam from "./_components/ActiveTeam";
import useTranslation from 'next-translate/useTranslation'
import Badges from "./_components/Badges";

export default function Pasaporte(){
  const [book, setBook] = useState(null as unknown as PageFlip) as [PageFlip, any]
  const {data: session} = useSession() as {data: BoffSession | null, status: string};
  const uuid = session?.user.smartRotomUser.uuid as string
  const username = session?.user.smartRotomUser.username as string
  const { t: movesTrans } = useTranslation("smartrotom/pokedex/moves")

  const [stats, setStats] = useState(null) as any
  const [team,setTeam] = useState(null) as any
  const [ achievements, setAchievements] = useState(null) as any

  useEffect(()=>{
    console.log('uuid',uuid)
    rotomPOST('/stats',{uuid}).then((res)=>{
      setStats(res)
    })
    rotomPOST('/team',{uuid}).then((res)=>{
      console.log('team',res)
      setTeam(res)
    })
    rotomPOST('/achievements',{uuid}).then((res)=>{
      console.log('achievements',res)
      setAchievements(res)
    })
  },[])

  let page  = 0;
    return(
      <section className=" bg-yellow-200 flex bg-center bg-no-repeat bg-fixed bg-cover">
          <Book setBook={setBook}>
            <Page book={book} number={0} className="font-vinque bg-blue-600 flex  flex-col " style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
              <div className="text-center text-6xl mt-4 text-yellow-200 font-bold opacity-80" style={{ mixBlendMode: 'normal' }}>PASAPORTE</div>
              <img className="h-0 flex-1  opacity-80" src="/smartrotom/img/logo.webp" alt="description" style={{ mixBlendMode: 'normal' }} />
              <div className="mb-4 text-center text-4xl  text-yellow-200 font-bold  opacity-80" style={{ mixBlendMode: 'normal' }}>Región de Teras</div>
            </Page>
            <Page book={book} number={1} >
              <PageTitle title="Indice"/>
              <div className="flex flex-col">
                <button onClick={(e) => turnPage(book, 2, e)} className="text-2xl font-bold">1. Datos Jugador</button>
                <button onClick={(e) => turnPage(book, 3, e)} className="text-2xl font-bold">2. Equipo Actual</button>
                <button onClick={(e) => turnPage(book, 4, e)} className="text-2xl font-bold">3. Medallas</button>

              </div>
            </Page>
            <Page book={book} number={2} >
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
            <Page book={book} number={3} >
              <PageTitle title="Equipo Actual"/>
              {team && <ActiveTeam team={team} />}
            </Page>
            <Page book={book} number={4} >
              <PageTitle title="Medallas"/>
              <Badges achievementData={achievements}></Badges>
            </Page>
            <Page book={book} number={5} >Page 5</Page>
            <Page book={book} number={6} >Page 6</Page>
            <Page book={book} number={7}  style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
            </Page>
          </Book>
      </section>
    )


    function PageTitle({title}: {title: string}){
      return <div className="text-2xl 2xl:text-4xl font-bold 2xl:m-2 font-vinque underline">{title}</div>
    }
}