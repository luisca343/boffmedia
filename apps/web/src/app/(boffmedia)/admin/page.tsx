"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Gamepad2, Calendar, Users, Award, CreditCard, BarChart2, Download, Library, Settings } from "lucide-react"
import { AdminLayout } from "@/components/boffmedia/ui/admin/admin-layout"
import { useBoffSession } from "@/services/useBoffSession"
import { USER_ROLES } from "@boffmedia/shared/roles"
import { GamesAdmin } from "./_sections/games-admin"
import { EventsAdmin } from "./_sections/events-admin"
import { TeamsAdmin } from "./_sections/teams-admin"
import { AchievementsAdmin } from "./_sections/achievements-admin"
import { TcgpScraper } from "./_components/tools/TcgpScraper"
import { VgcMetaPanel } from "./_components/tools/VgcMetaPanel"
import MangaDownloader from "./_components/manga/MangaDownloader"
import MangaLibrary from "./_components/manga/MangaLibrary"
import MangaConfig from "./_components/manga/MangaConfig"
import UnauthorizedPage from "../_components/Unauthorized"

const NAV = [
  {
    label: "Portal",
    items: [
      { id: "games",        label: "Juegos",   icon: Gamepad2  },
      { id: "events",       label: "Eventos",  icon: Calendar  },
      { id: "teams",        label: "Equipos",  icon: Users     },
      { id: "achievements", label: "Logros",   icon: Award     },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { id: "tcgp",    label: "TCG Pocket", icon: CreditCard },
      { id: "vgc-meta", label: "VGC Meta",  icon: BarChart2  },
    ],
  },
  {
    label: "Manga",
    items: [
      { id: "manga-downloader", label: "Descargador", icon: Download  },
      { id: "manga-library",    label: "Biblioteca",  icon: Library   },
      { id: "manga-config",     label: "Config",      icon: Settings  },
    ],
  },
] as const

type SectionId = typeof NAV[number]["items"][number]["id"]

const VALID_SECTIONS = NAV.flatMap((g) => g.items.map((i) => i.id)) as SectionId[]

function AdminContent() {
  const router            = useRouter()
  const searchParams      = useSearchParams()
  const { session, status } = useBoffSession()

  const rawSection = searchParams.get("section")
  const section: SectionId = (VALID_SECTIONS as string[]).includes(rawSection ?? "")
    ? (rawSection as SectionId)
    : "games"

  const navigate = (id: SectionId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  if (!session?.user.roles.includes(USER_ROLES.BOFF_ADMIN)) {
    return <UnauthorizedPage />
  }

  return (
    <AdminLayout nav={NAV as any} section={section} onNavigate={navigate} loading={status === "loading"}>
      {section === "games"             && <GamesAdmin />}
      {section === "events"            && <EventsAdmin />}
      {section === "teams"             && <TeamsAdmin />}
      {section === "achievements"      && <AchievementsAdmin />}
      {section === "tcgp"              && <TcgpScraper />}
      {section === "vgc-meta"          && <VgcMetaPanel />}
      {section === "manga-downloader"  && <MangaDownloader />}
      {section === "manga-library"     && <MangaLibrary />}
      {section === "manga-config"      && <MangaConfig />}
    </AdminLayout>
  )
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  )
}
