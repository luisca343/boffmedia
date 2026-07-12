"use client";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";
import { ToastHost } from "./_components/ui";
import useStarBank from "./_hooks/useStarBank";
import { changeActiveAccount } from "./bankUtils";

const MESH =
  "radial-gradient(900px 600px at 88% -10%, rgba(36,99,235,.08), transparent 60%)," +
  "radial-gradient(700px 500px at -10% 110%, rgba(36,99,235,.05), transparent 60%)";

export default function StarbankLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { accounts, activeAccount, setActiveAccount } = useStarBank();

  const seg = pathname.split("/").filter(Boolean).pop() || "starbank";
  const currentPage = seg;
  const goAccounts = () => router.push("/smartrotom/starbank/cuentas");
  const selectAccount = (id: number) => {
    changeActiveAccount(id);
    setActiveAccount(id);
  };

  return (
    <div className="sb-app relative grid h-[calc(100dvh_-_3rem)] w-full min-w-0 grid-cols-1 overflow-hidden bg-sb-bg font-sb text-sb-fg [font-feature-settings:'cv11','ss01','ss03'] md:grid-cols-[256px_1fr]">
      <div className="pointer-events-none absolute inset-0 z-0" style={{ background: MESH }} aria-hidden />

      <Sidebar currentPage={currentPage} account={activeAccount} onOpenAccounts={goAccounts} />

      <div className="relative z-[1] flex h-full min-w-0 flex-col overflow-y-auto">
        <TopBar currentPage={currentPage} account={activeAccount} accounts={accounts} onSelectAccount={selectAccount} onOpenAccounts={goAccounts} />
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 p-4 md:p-7">{children}</div>
      </div>

      <ToastHost />
    </div>
  );
}
