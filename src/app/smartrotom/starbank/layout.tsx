"use client";
import { usePathname } from "next/navigation";
import { SideMenu } from "./_components/SideMenu";
import TopBar from "./_components/TopBar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  const currentRoute = usePathname();
  let currentPage = currentRoute.split("/").pop();

  if(currentPage === undefined) {
    currentPage = "home";
  }


  return (
    <div
      className="flex overflow-hidden bg-blue-50 "
      style={{
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <SideMenu currentPage={currentPage}/>
      <div className="h-full w-full overflow-hidden">
        <TopBar  currentPage={currentPage}/>
        <div className="h-full w-full">{children}</div>
      </div>
    </div>
  );
}