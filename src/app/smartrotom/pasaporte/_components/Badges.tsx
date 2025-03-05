import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { parseDate } from "@/lib/utils"
import type { SmartRotomAchievement } from "../_types/Achievement"
import { BookLink } from "@/components/ui/book/book"

export default function Badges({ achievementData, book }: { achievementData: SmartRotomAchievement[]; book: any }) {
  if (!achievementData) return null

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
    },
    {
      title: "Circuito de Fukitsu-Gansolia",
      data: achievementData.filter((a) => a.subcategory === "Fukitsu-Gansolia"),
    },
    {
      title: "Circuito de Narukami-Akina",
      data: achievementData.filter((a) => a.subcategory === "Narukami-Akina"),
    },
    {
      title: "Ligas",
      data: achievementData.filter((a) => a.category === "Ligas"),
    },
    {
      title: "Frente Batalla",
      data: achievementData.filter((a) => a.category === "Frente Batalla"),
    },
  ]

  return (
    <div className="flex flex-col p-6 space-y-8 font-vinque">
      {sections.map((section) => {
        const completed = section.data.filter((a) => a.completed).length
        return (
          <div key={section.title} className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight border-b border-black/10 pb-2">
              {section.title} [{completed}/{section.data.length}]
            </h3>
            <div className="flex flex-wrap gap-2">
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

function Badge({ data, book, badges }: { data: SmartRotomAchievement; book: any; badges: { id: string }[] }) {
  return (
    <HoverCard>
      <BookLink
        book={book}
        page={data.completed ? 5 + getBadgeIndex(data, badges) : 4}
        className="group relative block transition-transform duration-200 hover:scale-110"
      >
        <HoverCardTrigger >
          <div className="relative  pointer-events-none">
            <div
              className={`
                w-12 h-12 2xl:w-16 2xl:h-16 rounded-lg overflow-hidden
                transition-all duration-200
                ${data.completed ? "" : "filter brightness-0"}`} // grayscale opacity-50
            >
              <img
                src={`https://api.boffmedia.es/smartrotom/img/logros/${data.icon}.webp`}
                alt={data.name}
                className="w-full h-full object-contain relative z-10"
              />
            </div>
          </div>
        </HoverCardTrigger>
      </BookLink>

      <HoverCardContent
        variant="paper"
        align="start"
        className="z-50 max-w-sm border border-black/10 bg-white/95 p-4 shadow-xl"
      >
        <div className="flex flex-col space-y-2">
          <h4 className="font-bold text-xl border-b border-black/10 pb-1">{data.name}</h4>
          <p className="text-sm text-gray-700">{data.description}</p>
          <p className="text-sm font-medium">
            {data.completed ? (
              <span className="text-green-700">Obtenida: {parseDate(data.completedAt)}</span>
            ) : (
              <span className="text-gray-500">No completado</span>
            )}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function getBadgeIndex(badge: SmartRotomAchievement, badges: { id: string }[]): number {
  return badges.findIndex((b) => b.id === badge.id)
}

