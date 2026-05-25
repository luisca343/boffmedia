"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SideMenu } from "./_components/SideMenu";
import TopBar from "./_components/TopBar";
// @ts-ignore — CSS side-effect import for Starbank design tokens
import "../smartrotom.css";

type SbTheme = "light" | "dark";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  const currentRoute = usePathname();
  const segments = currentRoute.split("/");
  const currentPage = segments.pop() || segments.pop() || "starbank";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<SbTheme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("sb-theme") as SbTheme | null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  function toggleTheme() {
    setTheme((t) => {
      const next: SbTheme = t === "light" ? "dark" : "light";
      localStorage.setItem("sb-theme", next);
      return next;
    });
  }

  return (
    <div
      data-sb-theme={theme}
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
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
