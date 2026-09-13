"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useBoffSession } from "@/services/useBoffSession";
import { USER_ROLES } from "@boffmedia/shared/roles";
import { AvShell, type AvNavGroup } from "../_components/ui/av-shell";
import type { IconName } from "@boffmedia/ui";
import { GamesAdmin } from "../_sections/games-admin";
import { EventsAdmin } from "../_sections/events-admin";
import { TeamsAdmin } from "../_sections/teams-admin";
import { AchievementsAdmin } from "../_sections/achievements-admin";
import { TournamentsAdmin } from "../_sections/tournaments-admin";
import { PacksAdmin } from "../_sections/packs-admin";
import { ProductReleasesAdmin } from "../_sections/product-releases-admin";
import { DesktopReleasesAdmin } from "../_sections/desktop-releases-admin";
import { SecurityAdmin } from "../_sections/security-admin";
import { ModerationAdmin } from "../_sections/moderation-admin";
import { RandomizerAdmin } from "../_sections/randomizer-admin";
import { TcgpSync } from "../_sections/tcgp-admin/TcgpSync";
import { VgcMetaPanel } from "../_sections/vgc-admin/VgcMetaPanel";
import { MhwildsAnatomyAdmin } from "../_sections/mhwilds-anatomy-admin";
import MangaDownloader from "../_sections/manga-admin/MangaDownloader";
import MangaLibrary from "../_sections/manga-admin/MangaLibrary";
import MangaConfig from "../_sections/manga-admin/MangaConfig";
import { AuditAdmin } from "../_sections/audit-admin";
import UnauthorizedPage from "@/components/boffmedia/ui/layout/Unauthorized";

const CONSOLE_ROLES: readonly string[] = [
  USER_ROLES.BOFF_ADMIN,
  USER_ROLES.BOFF_ADMIN_CONTENT,
  USER_ROLES.BOFF_ADMIN_RELEASE,
];

type NavMeta = {
  labelKey: string;
  items: {
    id: string;
    labelKey: string;
    icon: IconName;
    access?: readonly string[];
  }[];
};

const NAV_META: NavMeta[] = [
  {
    labelKey: "portal",
    items: [
      {
        id: "games",
        labelKey: "games",
        icon: "gamepad",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT],
      },
      {
        id: "events",
        labelKey: "events",
        icon: "calendar",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT],
      },
      {
        id: "teams",
        labelKey: "teams",
        icon: "users",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT],
      },
      {
        id: "achievements",
        labelKey: "achievements",
        icon: "trophy",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT],
      },
      {
        id: "tournaments",
        labelKey: "tournaments",
        icon: "sword",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT],
      },
      {
        id: "moderation",
        labelKey: "moderation",
        icon: "shield",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT],
      },
    ],
  },
  {
    labelKey: "app",
    items: [
      {
        id: "packs",
        labelKey: "packs",
        icon: "cube",
        access: [USER_ROLES.BOFF_ADMIN],
      },
      {
        id: "product-releases",
        labelKey: "productReleases",
        icon: "sparkles",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_RELEASE],
      },
      {
        id: "releases",
        labelKey: "releases",
        icon: "upload",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_RELEASE],
      },
      {
        id: "randomizer",
        labelKey: "randomizer",
        icon: "sparkles",
        access: [USER_ROLES.BOFF_ADMIN],
      },
    ],
  },
  {
    labelKey: "account",
    items: [
      {
        id: "security",
        labelKey: "security",
        icon: "shield",
        access: [USER_ROLES.BOFF_ADMIN],
      },
      {
        id: "audit",
        labelKey: "audit",
        icon: "list",
        access: [USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT],
      },
    ],
  },
  {
    labelKey: "tools",
    items: [
      {
        id: "tcgp",
        labelKey: "tcgp",
        icon: "cards",
        access: [USER_ROLES.BOFF_ADMIN],
      },
      {
        id: "vgc-meta",
        labelKey: "vgcMeta",
        icon: "chart",
        access: [USER_ROLES.BOFF_ADMIN],
      },
      {
        id: "mhwilds-anatomy",
        labelKey: "mhwildsAnatomy",
        icon: "crosshair",
        access: [USER_ROLES.BOFF_ADMIN],
      },
    ],
  },
  {
    labelKey: "manga",
    items: [
      {
        id: "manga-downloader",
        labelKey: "mangaDownloader",
        icon: "download",
        access: [USER_ROLES.BOFF_ADMIN],
      },
      {
        id: "manga-library",
        labelKey: "mangaLibrary",
        icon: "book",
        access: [USER_ROLES.BOFF_ADMIN],
      },
      {
        id: "manga-config",
        labelKey: "mangaConfig",
        icon: "settings",
        access: [USER_ROLES.BOFF_ADMIN],
      },
    ],
  },
];

function canAccess(item: NavMeta["items"][number], roles: readonly string[]) {
  return !item.access || item.access.some((role) => roles.includes(role));
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, status } = useBoffSession();
  const t = useTranslations("admin.nav");

  const roles = session?.user.roles ?? [];
  const accessibleItems = NAV_META.flatMap((group) =>
    group.items.filter((item) => canAccess(item, roles)),
  );
  const rawSection = searchParams.get("section");
  const section = accessibleItems.some((item) => item.id === rawSection)
    ? (rawSection as string)
    : (accessibleItems[0]?.id ?? "");

  const nav: AvNavGroup[] = NAV_META.map((g) => {
    const items = g.items
      .filter((item) => canAccess(item, roles))
      .map((i) => ({ id: i.id, label: t(i.labelKey), icon: i.icon }));

    return { label: t(g.labelKey), items };
  });

  const navigate = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  if (!roles.some((role) => CONSOLE_ROLES.includes(role))) {
    return <UnauthorizedPage />;
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
      {section === "games" && <GamesAdmin />}
      {section === "events" && <EventsAdmin />}
      {section === "teams" && <TeamsAdmin />}
      {section === "achievements" && <AchievementsAdmin />}
      {section === "tournaments" && <TournamentsAdmin />}
      {section === "packs" && <PacksAdmin />}
      {section === "product-releases" && <ProductReleasesAdmin />}
      {section === "releases" && <DesktopReleasesAdmin />}
      {section === "randomizer" && <RandomizerAdmin />}
      {section === "tcgp" && <TcgpSync />}
      {section === "vgc-meta" && <VgcMetaPanel />}
      {section === "mhwilds-anatomy" && <MhwildsAnatomyAdmin />}
      {section === "manga-downloader" && <MangaDownloader />}
      {section === "manga-library" && <MangaLibrary />}
      {section === "manga-config" && <MangaConfig />}
      {section === "moderation" && <ModerationAdmin />}
      {section === "security" && <SecurityAdmin />}
      {section === "audit" && <AuditAdmin />}
    </AvShell>
  );
}

export function AdminConsole() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  );
}
