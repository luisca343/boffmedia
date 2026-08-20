"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useBoffSession } from "@/services/useBoffSession"
import { USER_ROLES } from "@boffmedia/shared/roles"
import { AvShell, type AvNavGroup } from "./_components/ui/av-shell"
import type { IconName } from "@boffmedia/ui"
import { GamesAdmin } from "./_sections/games-admin"
import { EventsAdmin } from "./_sections/events-admin"
import { TeamsAdmin } from "./_sections/teams-admin"
import { AchievementsAdmin } from "./_sections/achievements-admin"
import { TournamentsAdmin } from "./_sections/tournaments-admin"
import { PacksAdmin } from "./_sections/packs-admin"
import { DesktopReleasesAdmin } from "./_sections/desktop-releases-admin"
import { RandomizerAdmin } from "./_sections/randomizer-admin"
import { TcgpScraper } from "./_components/tools/TcgpScraper"
import { VgcMetaPanel } from "./_components/tools/VgcMetaPanel"
import MangaDownloader from "./_components/manga/MangaDownloader"
import MangaLibrary from "./_components/manga/MangaLibrary"
import MangaConfig from "./_components/manga/MangaConfig"
import UnauthorizedPage from "../_components/Unauthorized"

const NAV_META: { labelKey: string; items: { id: string; labelKey: string; icon: IconName }[] }[] = [
  {
    labelKey: "portal",
    items: [
      { id: "games",        labelKey: "games",        icon: "gamepad"  },
      { id: "events",       labelKey: "events",       icon: "calendar" },
      { id: "teams",        labelKey: "teams",        icon: "users"    },
      { id: "achievements", labelKey: "achievements", icon: "trophy"   },
      { id: "tournaments",  labelKey: "tournaments",  icon: "sword"    },
    ],
  },
  {
    labelKey: "app",
    items: [
      { id: "packs", labelKey: "packs", icon: "cube" },
      { id: "releases", labelKey: "releases", icon: "upload" },
      { id: "randomizer", labelKey: "randomizer", icon: "sparkles" },
    ],
  },
  {
    labelKey: "tools",
    items: [
      { id: "tcgp",     labelKey: "tcgp",     icon: "cards" },
      { id: "vgc-meta", labelKey: "vgcMeta",  icon: "chart" },
    ],
  },
  {
    labelKey: "manga",
    items: [
      { id: "manga-downloader", labelKey: "mangaDownloader", icon: "download" },
      { id: "manga-library",    labelKey: "mangaLibrary",    icon: "book"     },
      { id: "manga-config",     labelKey: "mangaConfig",     icon: "settings" },
    ],
  },
]

const VALID_SECTIONS = NAV_META.flatMap((g) => g.items.map((i) => i.id))

function AdminContent() {
  const router            = useRouter()
  const searchParams      = useSearchParams()
  const { session, status } = useBoffSession()
  const t = useTranslations("admin.nav")

  const rawSection = searchParams.get("section")
  const section = VALID_SECTIONS.includes(rawSection ?? "") ? (rawSection as string) : "games"

  const nav: AvNavGroup[] = NAV_META.map((g) => ({
    label: t(g.labelKey),
    items: g.items.map((i) => ({ id: i.id, label: t(i.labelKey), icon: i.icon })),
  }))

  const navigate = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  if (!session?.user.roles.includes(USER_ROLES.BOFF_ADMIN)) {
    return <UnauthorizedPage />
  }

  return (
    <AvShell
      nav={nav}
      section={section}
      onNavigate={navigate}
      loading={status === "loading"}
      // Packs is an app, not a document: it wants the whole viewport and
      // manages its own scrolling. The rest keep the reading measure.
      fluid={section === "packs"}
    >
      {section === "games"             && <GamesAdmin />}
      {section === "events"            && <EventsAdmin />}
      {section === "teams"             && <TeamsAdmin />}
      {section === "achievements"      && <AchievementsAdmin />}
      {section === "tournaments"       && <TournamentsAdmin />}
      {section === "packs"             && <PacksAdmin />}
      {section === "releases"          && <DesktopReleasesAdmin />}
      {section === "randomizer"        && <RandomizerAdmin />}
      {section === "tcgp"              && <TcgpScraper />}
      {section === "vgc-meta"          && <VgcMetaPanel />}
      {section === "manga-downloader"  && <MangaDownloader />}
      {section === "manga-library"     && <MangaLibrary />}
      {section === "manga-config"      && <MangaConfig />}
    </AvShell>
  )
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  )
}
