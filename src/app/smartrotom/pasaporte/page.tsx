'use client'
import { Book, Page } from "@/components/ui/book/book";
import './pasaporte.css'
import { useSession } from "next-auth/react";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { CabezaJugador } from "@/components/smartrotom/CabezaMC";
import { useEffect, useState } from "react";
import { rotomPOST } from "@/services/boffAPI";
import ActiveTeam from "./_components/ActiveTeam";
import useTranslation from 'next-translate/useTranslation'

export default function Pasaporte(){
  const [book, setBook] = useState(null) as any
  const {data: session} = useSession() as {data: BoffSession | null, status: string};
  const uuid = session?.user.smartRotomUser.uuid as string
  const username = session?.user.smartRotomUser.username as string
  const { t: movesTrans } = useTranslation("smartrotom/pokedex/moves")

  const [stats, setStats] = useState(null) as any
  const [team,setTeam] = useState(null) as any

  useEffect(()=>{
    console.log('uuid',uuid)
    rotomPOST('/stats',{uuid}).then((res)=>{
      setStats(res)
    })
    rotomPOST('/team',{uuid}).then((res)=>{
      console.log('team',res)
      setTeam(res)
    })
  },[])

  let page  = 0;
    return(
      <section className=" bg-yellow-200 flex bg-center bg-no-repeat bg-fixed bg-cover">
          <Book setBook={setBook}>
            <Page className="font-vinque bg-blue-600 flex  flex-col " style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
              <div className="text-center text-6xl mt-4 text-yellow-200 font-bold opacity-80" style={{ mixBlendMode: 'normal' }}>PASAPORTE</div>
              <img className="h-0 flex-1  opacity-80" src="/smartrotom/img/logo.webp" alt="description" style={{ mixBlendMode: 'normal' }} />
              <div className="mb-4 text-center text-4xl  text-yellow-200 font-bold  opacity-80" style={{ mixBlendMode: 'normal' }}>Región de Teras</div>
            </Page>
            <Page>
              <PageTitle title="Indice"/>
            </Page>
            <Page>
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
            <Page>
              <PageTitle title="Equipo Actual"/>
              {team && <ActiveTeam team={team} />}
            </Page>
            <Page>Page 4</Page>
            <Page>Page 5</Page>
            <Page>Page 6</Page>
            <Page style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
            </Page>
          </Book>
      </section>
    )


    function PageTitle({title}: {title: string}){
      return <div className="text-2xl 2xl:text-4xl font-bold 2xl:m-2 font-vinque underline">{title}</div>
    }
}