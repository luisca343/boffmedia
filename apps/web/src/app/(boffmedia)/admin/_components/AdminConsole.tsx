"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useBoffSession } from "@/services/useBoffSession"
import { USER_ROLES } from "@boffmedia/shared/roles"
import { AvShell, type AvNavGroup } from "../_components/ui/av-shell"
import type { IconName } from "@boffmedia/ui"
import { GamesAdmin } from "../_sections/games-admin"
import { EventsAdmin } from "../_sections/events-admin"
import { TeamsAdmin } from "../_sections/teams-admin"
import { AchievementsAdmin } from "../_sections/achievements-admin"
import { TournamentsAdmin } from "../_sections/tournaments-admin"
import { PacksAdmin } from "../_sections/packs-admin"
import { DesktopReleasesAdmin } from "../_sections/desktop-releases-admin"
import { SecurityAdmin } from "../_sections/security-admin"
import { ModerationAdmin } from "../_sections/moderation-admin"
import { RandomizerAdmin } from "../_sections/randomizer-admin"
import { TcgpSync } from "../_sections/tcgp-admin/TcgpSync"
import { VgcMetaPanel } from "../_sections/vgc-admin/VgcMetaPanel"
import { MhwildsAnatomyAdmin } from "../_sections/mhwilds-anatomy-admin"
import MangaDownloader from "../_sections/manga-admin/MangaDownloader"
import MangaLibrary from "../_sections/manga-admin/MangaLibrary"
import MangaConfig from "../_sections/manga-admin/MangaConfig"
import { AuditAdmin } from "../_sections/audit-admin"
import UnauthorizedPage from "@/components/boffmedia/ui/layout/Unauthorized"

const NAV_META: { labelKey: string; items: { id: string; labelKey: string; icon: IconName }[] }[] = [
  {
    labelKey: "portal",
    items: [
      { id: "games",        labelKey: "games",        icon: "gamepad"  },
      { id: "events",       labelKey: "events",       icon: "calendar" },
      { id: "teams",        labelKey: "teams",        icon: "users"    },
      { id: "achievements", labelKey: "achievements", icon: "trophy"   },
      { id: "tournaments",  labelKey: "tournaments",  icon: "sword"    },
      { id: "moderation",   labelKey: "moderation",   icon: "shield"   },
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
    labelKey: "account",
    items: [
      { id: "security", labelKey: "security", icon: "shield" },
      { id: "audit", labelKey: "audit", icon: "list" },
    ],
  },
  {
    labelKey: "tools",
    items: [
      { id: "tcgp",     labelKey: "tcgp",     icon: "cards" },
      { id: "vgc-meta", labelKey: "vgcMeta",  icon: "chart" },
      { id: "mhwilds-anatomy", labelKey: "mhwildsAnatomy", icon: "crosshair" },
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

  // Filter nav items based on user roles
  // Audit requires BOFF_ADMIN_CONTENT (content admin sub-role) or BOFF_ADMIN (superuser)
  const userHasAuditAccess = session?.user.roles?.some(r =>
    r === USER_ROLES.BOFF_ADMIN || r === USER_ROLES.BOFF_ADMIN_CONTENT
  ) ?? false

  const nav: AvNavGroup[] = NAV_META.map((g) => {
    let items = g.items.map((i) => ({ id: i.id, label: t(i.labelKey), icon: i.icon }))

    // Filter out audit if user doesn't have permission
    if (g.labelKey === "account" && !userHasAuditAccess) {
      items = items.filter(i => i.id !== "audit")
    }

    return { label: t(g.labelKey), items }
  })

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
      {section === "tcgp"              && <TcgpSync />}
      {section === "vgc-meta"          && <VgcMetaPanel />}
      {section === "mhwilds-anatomy"   && <MhwildsAnatomyAdmin />}
      {section === "manga-downloader"  && <MangaDownloader />}
      {section === "manga-library"     && <MangaLibrary />}
      {section === "manga-config"      && <MangaConfig />}
      {section === "moderation"        && <ModerationAdmin />}
      {section === "security"          && <SecurityAdmin />}
      {section === "audit"             && <AuditAdmin />}
    </AvShell>
  )
}

export function AdminConsole() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  )
}
