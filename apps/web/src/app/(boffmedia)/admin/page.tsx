"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2, Calendar, Users, Award, CreditCard, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoffSession } from "../../../services/useBoffSession";
import UnauthorizedPage from "../_components/Unauthorized";
import { GamesTab } from "./events/_components/games/GamesTab";
import { EventsTab } from "./events/_components/events/EventsTab";
import { TeamsTab } from "./events/_components/teams/TeamsTab";
import { AchievementsTab } from "./events/_components/achievements/AchievementsTab";
import { TcgpScraper } from "./_components/tools/TcgpScraper";
import { VgcSmogonFetcher } from "./_components/tools/VgcSmogonFetcher";
import { VgcChampionsFetcher } from "./_components/tools/VgcChampionsFetcher";
import { VgcLimitlessFetcher } from "./_components/tools/VgcLimitlessFetcher";
import { ToastContainer } from "react-toastify";
import { USER_ROLES } from "@boffmedia/shared/roles";
import "react-toastify/dist/ReactToastify.css";

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
    <div className="flex min-h-screen bg-surface-950">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r border-surface-800 py-6 px-3 gap-1">
        <p className="px-3 mb-4 text-lg font-bold text-surface-50">Admin</p>

        {NAV.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-surface-600">
              {group.label}
            </p>
            {group.items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  section === id
                    ? "bg-primary-500/15 text-primary-300"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        {/* Mobile nav — pill strip */}
        <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-2">
          {NAV.map((group) =>
            group.items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
                  section === id
                    ? "bg-primary-500/15 border-primary-500/40 text-primary-300"
                    : "border-surface-700 text-surface-400 hover:border-surface-600 hover:text-surface-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))
          )}
        </div>

        {section === "games"        && <GamesTab />}
        {section === "events"       && <EventsTab />}
        {section === "teams"        && <TeamsTab />}
        {section === "achievements" && <AchievementsTab />}
        {section === "tcgp"         && <TcgpScraper />}
        {section === "vgc-meta"     && (
          <div className="space-y-12">
            <VgcSmogonFetcher />
            <div className="border-t border-surface-800" />
            <VgcChampionsFetcher />
            <div className="border-t border-surface-800" />
            <VgcLimitlessFetcher />
          </div>
        )}
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
