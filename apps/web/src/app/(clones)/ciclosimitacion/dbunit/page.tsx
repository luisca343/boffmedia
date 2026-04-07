import { Header } from "../_components/Header";
import { Sidebar } from "../_components/Sidebar";
import { TopBar } from "../_components/TopBar";
import { MainContent } from "./_components/Content";

export default function Page() {
  return (
    <div className="font-['Roboto',_sans-serif] text-base text-[#444] bg-white min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex flex-1 pt-[98px]">
        <Sidebar isSidebarCollapsed={false} />
        <MainContent isSidebarCollapsed={false} />
      </div>
    </div>
  )
}