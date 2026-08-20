"use client";
import { usePathname, useRouter } from "next/navigation";
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme";
import { AppQueryProvider as StarBankQueryProvider } from "@/components/smartrotom/behavior/QueryProvider";
import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";
import { ToastHost } from "./_components/ui";
import useStarBank from "./_hooks/useStarBank";
import { changeActiveAccount } from "./bankUtils";

// The brand wash over the canvas. Dark carries it harder — an 8% blue over navy is
// invisible, where over near-white it is already a visible tint.
const MESH: Record<"light" | "dark", string> = {
  light:
    "radial-gradient(900px 600px at 88% -10%, rgba(36,99,235,.08), transparent 60%)," +
    "radial-gradient(700px 500px at -10% 110%, rgba(36,99,235,.05), transparent 60%)",
  dark:
    "radial-gradient(900px 600px at 88% -10%, rgba(59,130,246,.16), transparent 60%)," +
    "radial-gradient(700px 500px at -10% 110%, rgba(139,92,246,.10), transparent 60%)",
};

// Every page under `/starbank` calls `useStarBank`/the query hooks, and so does this
// layout (it needs the active account for the sidebar and top bar) — so the provider
// has to wrap this component from the outside, not sit inside its own returned tree.
export default function StarbankLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <StarBankQueryProvider>
      <StarbankLayoutBody>{children}</StarbankLayoutBody>
    </StarBankQueryProvider>
  );
}

function StarbankLayoutBody({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { accounts, activeAccount, setActiveAccount } = useStarBank();
  // Light/dark is the platform's choice, not Starbank's.
  const theme = useRotomMode();

  const seg = pathname.split("/").filter(Boolean).pop() || "starbank";
  const currentPage = seg;
  const goAccounts = () => router.push("/smartrotom/starbank/cuentas");
  const selectAccount = (id: number) => {
    changeActiveAccount(id);
    setActiveAccount(id);
  };

  return (
    <div
      className="sb-app relative grid h-[calc(100dvh_-_3rem)] w-full min-w-0 grid-cols-1 overflow-hidden bg-sb-bg font-sb text-sb-fg [font-feature-settings:'cv11','ss01','ss03'] md:grid-cols-[256px_1fr]"
      data-theme={theme}
    >
      <div className="pointer-events-none absolute inset-0 z-0" style={{ background: MESH[theme] }} aria-hidden />

      <Sidebar currentPage={currentPage} account={activeAccount} onOpenAccounts={goAccounts} />

      <div className="relative z-[1] flex h-full min-w-0 flex-col overflow-y-auto">
        <TopBar currentPage={currentPage} account={activeAccount} accounts={accounts} onSelectAccount={selectAccount} onOpenAccounts={goAccounts} />
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 p-4 md:p-7">{children}</div>
      </div>

      <ToastHost />
    </div>
  );
}
