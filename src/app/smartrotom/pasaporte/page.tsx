'use client'
import { Book, BookLink, Page, PageFlip, PageTitle, turnPage } from "@/components/ui/book/book";
import './pasaporte.css'
import { useState } from "react";
import ActiveTeam from "./_components/ActiveTeam";
import Badges from "./_components/Badges";
import { parseDate } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Game } from "@/app/battlesim/replay/_components/Game";
import { SmartRotomAchievement } from "./_types/Achievement";
import { useBoffSession } from "@/services/useBoffSession";
import { useGetPlayerStats } from "@/hooks/player/useGetPlayerStats";
import { useGetPlayerTeam } from "@/hooks/player/useGetPlayerTeam";
import { useGetAchievements } from "@/hooks/achievements/useGetAchievements";
import { PlayerStatsPage } from "./_components/PlayerStatsPage";
import { IndexPage } from "./_components/IndexPage";
import { BadgePage } from "./_components/BadgePage";
import { UserAchievement } from "@/generated/api";

export default function Pasaporte(){
  const [book, setBook] = useState<PageFlip>({ getPageCount: () => 0 })  
  const { session } = useBoffSession();
  const uuid = session?.user.smartRotomUser?.uuid as string
  const username = session?.user.smartRotomUser?.name as string

  const {playerStats} = useGetPlayerStats(uuid)
  const {playerTeam } = useGetPlayerTeam(uuid)
  const {achievements} = useGetAchievements(uuid)

  const obtainedBadges = (achievements ?? []).filter((achievement: UserAchievement)=>achievement.completed && achievement.category === 'Gimnasios').length

  let page  = 0;
  let badgePage = 4
    return(
      <section className=" bg-yellow-200 flex bg-center bg-no-repeat bg-fixed bg-cover">
          <Book setBook={setBook}>
            <Page dataDensity="hard" book={book} number={page++} className="font-vinque bg-blue-600 flex  flex-col bg-center bg-no-repeat bg-fixed bg-cover" style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/pasaporte.png)`}} />
            <Page book={book} number={page++} >
              <PageTitle title="Indice"/>
              <IndexPage book={book} badgePage={badgePage} achievements={achievements} obtainedBadges={obtainedBadges}/>
            </Page>
            <Page book={book} number={page++}>
                <PageTitle title="Datos Jugador" />
                <PlayerStatsPage stats={playerStats} username={username} uuid={uuid} />
            </Page>
            <Page book={book} number={page++} >
              <PageTitle title="Equipo Actual"/>
              {playerTeam && <ActiveTeam team={playerTeam} />}
            </Page>
            <Page book={book} number={page++}>
              <PageTitle title="Medallas - Resumen" />
              <div className="p-4 font-vinque">
                {achievements && <Badges book={book} achievementData={achievements} pageType={0} />}
              </div>
            </Page>
            <Page book={book} number={page++}>
              <PageTitle title="Medallas - Circuitos Regionales" />
              <div className="p-4 font-vinque">
                {achievements && <Badges book={book} achievementData={achievements} pageType={1} />}
              </div>
            </Page>
            <Page book={book} number={page++}>
              <PageTitle title="Medallas - Competiciones" />
              <div className="p-4 font-vinque">
                {achievements && <Badges book={book} achievementData={achievements} pageType={2} />}
              </div>
            </Page>
            {
              achievements &&
                achievements.map((achievement: UserAchievement) => {
                  if (achievement.completed && achievement.category === "Gimnasios") {
                    const team = achievement.team ? JSON.parse(achievement.team) : null
                    return (
                      <Page key={achievement.name} book={book} number={page++}>
                        <BadgePage achievement={achievement} team={team} />
                      </Page>
                    )
                  }
                })
            }
            <Page dataDensity="hard" book={book} number={page++}  style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
            </Page>
          </Book>
      </section>
    )


 

    function BadgePageTitle({title, achievement}: {title: string, achievement : SmartRotomAchievement}) {
      return (
        <div className="flex font-bold 2xl:m-2 font-vinque justify-between items-end">
          <div className="flex items-center">
            <img className="w-8 2xl:w-12 mr-2" src={`https://api.boffmedia.es/smartrotom/img/logros/${achievement.icon}.webp`} alt={achievement.icon} />
            <span className="underline text-2xl 2xl:text-4xl">{title}</span>
          </div>
          <div className="flex items-center">
            <span className="right-0 text-sm 2xl:text-base ">Obtenida: {parseDate(achievement.completedAt)}</span>
            {achievement.replay && (
              <Popover>
                <PopoverTrigger className="text-base self-end ml-2 hover:text-blue-500">Ver Reptición</PopoverTrigger>
                <PopoverContent className="ml-12 w-fit h-fit page border border-surface-950 shadow-2xl">
                  <Game battleName={achievement.id}/>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      );
    }
}