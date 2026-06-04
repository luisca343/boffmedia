"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2, Calendar, Users, Award, CreditCard, BarChart2, Download, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoffSession } from "../../../services/useBoffSession";
import UnauthorizedPage from "../_components/Unauthorized";
import { GamesTab } from "./events/_components/games/GamesTab";
import { EventsTab } from "./events/_components/events/EventsTab";
import { TeamsTab } from "./events/_components/teams/TeamsTab";
import { AchievementsTab } from "./events/_components/achievements/AchievementsTab";
import { TcgpScraper } from "./_components/tools/TcgpScraper";
import { VgcMetaPanel } from "./_components/tools/VgcMetaPanel";
import MangaDownloader from "./_components/manga/MangaDownloader";
import MangaLibrary from "./_components/manga/MangaLibrary";
import MangaConfig from "./_components/manga/MangaConfig";
import { ToastContainer } from "react-toastify";
import { USER_ROLES } from "@boffmedia/shared/roles";

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
] as const;

type SectionId = typeof NAV[number]["items"][number]["id"];

const VALID_SECTIONS = NAV.flatMap((g) => g.items.map((i) => i.id)) as SectionId[];

function AdminContent() {
  const router            = useRouter();
  const searchParams      = useSearchParams();
  const { session, status } = useBoffSession();

  const rawSection = searchParams.get("section");
  const section: SectionId = (VALID_SECTIONS as string[]).includes(rawSection ?? "")
    ? (rawSection as SectionId)
    : "games";

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session?.user.roles.includes(USER_ROLES.BOFF_ADMIN)) {
    return <UnauthorizedPage />;
  }

  const navigate = (id: SectionId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex min-h-screen bg-surface-950 pt-16">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r border-surface-800/80 bg-gradient-to-b from-surface-900 to-surface-950 py-5 px-3 gap-0.5">
        {/* Sidebar header */}
        <div className="px-3 mb-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-500/15 border border-primary-500/25 flex items-center justify-center shrink-0">
            <BarChart2 className="w-3.5 h-3.5 text-primary-400" />
          </div>
          <span className="text-sm font-bold text-surface-50 tracking-tight">Admin</span>
        </div>

        {NAV.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-surface-600">
              {group.label}
            </p>
            {group.items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  section === id
                    ? "bg-primary-500/10 text-primary-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]"
                    : "text-surface-400 hover:bg-surface-800/60 hover:text-surface-100"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0 transition-colors", section === id ? "text-primary-400" : "text-surface-500")} />
                {label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar — mobile nav + page header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-surface-900 via-surface-900 to-surface-800/85 border-b border-surface-800/80 shadow-sm px-4 py-3">
          {/* Mobile nav — horizontal scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-thin scrollbar-thumb-surface-700/70 scrollbar-track-transparent">
            <div className="inline-flex min-w-max items-center gap-1 rounded-xl border border-surface-700/80 bg-surface-800/70 p-1">
              {NAV.flatMap((group) =>
                group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                      section === id
                        ? "bg-primary-500/20 text-primary-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                        : "text-surface-400 hover:text-surface-100 hover:bg-surface-700/40"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Desktop page title */}
          <div className="hidden md:block">
            {(() => {
              const active = NAV.flatMap((g) => g.items as readonly { id: SectionId; label: string; icon: typeof Gamepad2 }[]).find((i) => i.id === section);
              const ActiveIcon = active?.icon;
              return (
                <div className="flex items-center gap-2">
                  {ActiveIcon && <ActiveIcon className="w-4 h-4 text-primary-400 shrink-0" />}
                  <span className="text-sm font-semibold text-surface-100">{active?.label ?? "Admin"}</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {section === "games"             && <GamesTab />}
          {section === "events"            && <EventsTab />}
          {section === "teams"             && <TeamsTab />}
          {section === "achievements"      && <AchievementsTab />}
          {section === "tcgp"              && <TcgpScraper />}
          {section === "vgc-meta"          && <VgcMetaPanel />}
          {section === "manga-downloader"  && <MangaDownloader />}
          {section === "manga-library"     && <MangaLibrary />}
          {section === "manga-config"      && <MangaConfig />}
        </div>
      </main>

      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  );
}
