import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { parseDate } from "@/lib/utils"
import type { SmartRotomAchievement } from "../_types/Achievement"
import { BookLink } from "@/components/ui/book/book"
import { Badge as UIBadge } from "@/components/ui/badge"
import { Medal, Lock } from "lucide-react"

export default function Badges({ achievementData, book, pageType = 0 }: { 
  achievementData: any[]; 
  book: any;
  pageType?: number; // 0: Summary, 1: Regional, 2: League
}) {
  if (!achievementData) return null

  // Extract gym badges for book navigation
  const badges: { id: string }[] = []
  achievementData.forEach((achievement) => {
    if (achievement.category === "Gimnasios") {
      badges.push(achievement)
    }
  })

  // Group achievements by category
  const sections = [
    {
      title: "Circuito de Principiantes",
      data: achievementData.filter((a) => a.subcategory === "Principiantes-N" || a.subcategory === "Principiantes-F"),
      type: 0
    },
    {
      title: "Circuito de Fukitsu-Gansolia",
      data: achievementData.filter((a) => a.subcategory === "Fukitsu-Gansolia"),
      type: 1
    },
    {
      title: "Circuito de Narukami-Akina",
      data: achievementData.filter((a) => a.subcategory === "Narukami-Akina"),
      type: 1
    },
    {
      title: "Ligas",
      data: achievementData.filter((a) => a.category === "Ligas"),
      type: 2
    },
    {
      title: "Frente Batalla",
      data: achievementData.filter((a) => a.category === "Frente Batalla"),
      type: 2
    },
  ].filter(section => section.data.length > 0);

  // Calculate overall completion percentage
  const totalAchievements = achievementData.length;
  const completedAchievements = achievementData.filter(a => a.completed).length;
  const completionPercentage = totalAchievements ? Math.round((completedAchievements / totalAchievements) * 100) : 0;

  const visibleSections = pageType === 0 
    ? sections 
    : sections.filter(s => s.type === pageType);

  // Ultra compact layout for summary page
  if (pageType === 0) {
    return (
      <div>
        {/* Minimal progress bar */}
        <div className="mb-2 text-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold">Progreso del Entrenador</span>
            <span>{completedAchievements}/{totalAchievements} ({completionPercentage}%)</span>
          </div>
          <div className="w-full bg-surface-200 rounded-full h-3">
            <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>

        {/* Minimal sections */}
        {visibleSections.map((section) => {
          const completed = section.data.filter((a) => a.completed).length;
          const sectionPercentage = Math.round((completed / section.data.length) * 100);
          
          return (
            <div key={section.title} className="mb-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{section.title}</span>
                <span>{completed}/{section.data.length} ({sectionPercentage}%)</span>
              </div>
              
              <div className="w-full bg-surface-200 rounded-full h-1 mb-2">
                <div 
                  className={`${completed === section.data.length ? 'bg-highlight-500' : 'bg-secondary-500'} h-1 rounded-full`}
                  style={{ width: `${sectionPercentage}%` }} 
                />
              </div>
              
              {/* Minimal badges grid - tiny icons with no borders */}
              <div className="grid grid-cols-5 gap-1 justify-items-center">
                {section.data.map((achievement) => (
                  <MicroBadge key={achievement.id} data={achievement} book={book} badges={badges} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 space-y-6 font-vinque">
      {visibleSections.map((section) => {
        const completed = section.data.filter((a) => a.completed).length;
        const sectionPercentage = Math.round((completed / section.data.length) * 100);
        
        return (
          <div key={section.title} className="space-y-3 bg-white/80 rounded-lg p-4 shadow-sm border border-surface-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight border-b border-black/10 pb-2">
                {section.title}
              </h3>
              <UIBadge variant={completed === section.data.length ? "success" : "outline"} className="text-sm">
                {completed}/{section.data.length} ({sectionPercentage}%)
              </UIBadge>
            </div>
            
            {/* Progress bar for this section */}
            <div className="w-full bg-surface-200 rounded-full h-2 mb-3">
              <div 
                className={`${completed === section.data.length ? 'bg-highlight-500' : 'bg-secondary-500'} h-2 rounded-full`}
                style={{ width: `${sectionPercentage}%` }} 
              />
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-items-center">
              {section.data.map((achievement) => (
                <Badge key={achievement.id} data={achievement} book={book} badges={badges} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Micro badge for ultra-compact summary page
function MicroBadge({ data, book, badges }: { data: SmartRotomAchievement; book: any; badges: { id: string }[] }) {
  return (
    <HoverCard>
      <BookLink
        book={book}
        page={getRedirectPage(data, badges)}
        className="block "
      >
        <HoverCardTrigger>
          <div className="relative pointer-events-none">
            <div className={`w-12 h-12 ${data.completed ? "" : "filter brightness-0 opacity-60"}`}>
              <img
                src={`https://api.boffmedia.es/smartrotom/img/logros/${data.icon}.webp`}
                alt={data.name}
                className="w-full h-full object-contain"
              />
              
              {/* Status indicator */}
              {!data.completed &&  (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-surface-500 opacity-80" />
                </div>
              )}
            </div>
          </div>
        </HoverCardTrigger>
      </BookLink>

      <HoverCardContent
        variant="paper"
        align="start"
        className="z-50 max-w-xs border border-black/10 bg-white/95 p-3 shadow-xl"
      >
        <div className="flex gap-2">
          <div className={`w-10 h-10 rounded-md overflow-hidden ${!data.completed && "filter grayscale opacity-70"}`}>
            <img
              src={`https://api.boffmedia.es/smartrotom/img/logros/${data.icon}.webp`}
              alt={data.name}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div>
            <h4 className="font-bold text-base border-b border-black/10 pb-0.5">{data.name}</h4>
            <p className="text-xs text-surface-700 line-clamp-2">{data.description}</p>
            <p className="text-xs font-medium mt-1">
              {data.completed ? (
                <span className="text-highlight-700">Obtenida: {parseDate(data.completedAt)}</span>
              ) : (
                <span className="text-surface-500">No completado</span>
              )}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// Standard badge for detailed pages
function Badge({ data, book, badges }: { data: SmartRotomAchievement; book: any; badges: { id: string }[] }) {
  return (
    <HoverCard>
      <BookLink
        book={book}
        page={getRedirectPage(data, badges)}
        className="group relative block transition-transform duration-200 hover:scale-110"
      >
        <HoverCardTrigger>
          <div className="relative pointer-events-none">
            <div
              className={`
                w-16 h-16 rounded-lg overflow-hidden 
                transition-all duration-300
                ${data.completed ? "" : "filter brightness-0 opacity-60"}`}
            >
              <img
                src={`https://api.boffmedia.es/smartrotom/img/logros/${data.icon}.webp`}
                alt={data.name}
                className="w-full h-full object-contain relative z-10"
              />
              
              {/* Status indicator */}
              {!data.completed &&  (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Lock className="w-5 h-5 text-surface-500 opacity-80" />
                </div>
              )}
            </div>
          </div>
        </HoverCardTrigger>
      </BookLink>

      <HoverCardContent
        variant="paper"
        align="start"
        className="z-50 max-w-sm border border-black/10 bg-white/95 p-4 shadow-xl"
      >
        <div className="flex gap-3">
          <div className={`min-w-[48px] h-12 w-12 rounded-md overflow-hidden ${!data.completed && "filter grayscale opacity-70"}`}>
            <img
              src={`https://api.boffmedia.es/smartrotom/img/logros/${data.icon}.webp`}
              alt={data.name}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <h4 className="font-bold text-xl border-b border-black/10 pb-1">{data.name}</h4>
            <p className="text-sm text-surface-700">{data.description}</p>
            <p className="text-sm font-medium">
              {data.completed ? (
                <span className="text-highlight-700 flex items-center gap-1">
                  <Medal className="w-4 h-4" />
                  Obtenida: {parseDate(data.completedAt)}
                </span>
              ) : (
                <span className="text-surface-500 flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  No completado
                </span>
              )}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function getRedirectPage(achievement: SmartRotomAchievement, badges: { id: string }[]): number {
  console.log("getRedirectPage", achievement.id)
  
  const index = badges.findIndex((b) => b.id === achievement.id)
  if (index === -1) return 4
  console.log("Redirect Page", achievement.completed ? 8 + index : 4)
  return achievement.completed ? 7 + index : 4
}

function getBadgeIndex(badge: SmartRotomAchievement, badges: { id: string }[]): number {
  console.log("getBadgeIndex", badge.id)
  console.log("Index", badges.findIndex((b) => b.id === badge.id))
  return badges.findIndex((b) => b.id === badge.id)
}