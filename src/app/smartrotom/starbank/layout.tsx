"use client";
import { SideMenu } from "./_components/SideMenu";
import TopBar from "./_components/TopBar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <div
      className="flex overflow-hidden bg-blue-100 "
      style={{
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <SideMenu />
      <div className="h-full w-full overflow-hidden">
        <TopBar />
        <div className="h-full w-full">{children}</div>
      </div>
    </div>
  );
}
