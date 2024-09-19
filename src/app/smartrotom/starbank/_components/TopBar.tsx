"use client"
import useStarBank from "../_hooks/useStarBank";
import { AccountImage } from "./AccountImage";

export default function TopBar({
  currentPage,
}: Readonly<{ currentPage: string }>) {
  const { accounts, setAccounts, activeAccount, setActiveAccount } = useStarBank() as any;

  

  const capitalizeFirstLetter = (string: string) => {
    if (string === "starbank") return "Dashboard";
    if (string === "enviar") return "Enviar Dinero";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };


  return (
    <header className="bg-blue-200 shadow-sm border-b border-blue-300">
      <div className="h-20 mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          {capitalizeFirstLetter(currentPage)}
        </h1>
        <div className="flex items-center">
          {activeAccount && <AccountImage width={40} height={40} type={activeAccount.type} name={activeAccount.name}/>}
        </div>
      </div>
    </header>
  );
}
