"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SideMenu } from "./_components/SideMenu";
import TopBar from "./_components/TopBar";
// @ts-ignore — CSS side-effect import for Starbank design tokens
import "../smartrotom.css";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  const currentRoute = usePathname();
  const segments = currentRoute.split("/");
  const currentPage = segments.pop() || segments.pop() || "starbank";

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="flex h-full"
      style={{ background: "var(--sb-bg, #f3f6fc)" }}
    >
      <SideMenu
        currentPage={currentPage}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <TopBar
          currentPage={currentPage}
          onToggleSidebar={() => setIsCollapsed((c) => !c)}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
