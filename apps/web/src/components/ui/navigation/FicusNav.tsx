"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Home, Menu, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { HerramientasMenu } from "./ToolsMenu";
import { WingullMenu } from "./WingullMenu";
import { InternalLink } from "./Link";
import { Button } from "@/components/ui/primitives/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/primitives/sheet";
import LanguageSwitcher from "./LanguageSwitcher";

const NotificationPopover = dynamic(() => import("./NotificationPopover"), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />,
});

const UserAuthSection = dynamic(() => import("./UserAuthSection"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />
      <div className="w-16 h-4 bg-surface-800 rounded animate-pulse" />
    </div>
  ),
});

const HIDDEN_APPS = ["smartrotom", "battlesim", "ciclosimitacion", "blog", "forum"];

export function FicusNav() {
  const pathname = usePathname();
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("nav");

  const NAV_LINKS = [
    { href: "/", label: t("links.home"), icon: <Home className="h-4 w-4" /> },
    { href: "/eventos", label: t("links.events"), icon: <Trophy className="h-4 w-4" /> },
    { href: "/herramientas", label: t("links.tools"), override: <HerramientasMenu /> },
    { href: "/wingull", label: t("links.pixelmonWingull"), override: <WingullMenu /> },
  ];

  useEffect(() => {
    const app = pathname.split("/")[1] || "boffmedia";
    setCurrentApp(app || null);
    setMounted(true);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const inPage = useCallback(
    (href: string) => (pathname.startsWith(href) && href !== "/") || pathname === href,
    [pathname],
  );

  const handleMenuItemClick = useCallback(() => setIsMenuOpen(false), []);

  const showActions = mounted && currentApp && !HIDDEN_APPS.includes(currentApp);

  return (
    <nav
      className={`fixed w-full z-30 h-16 transition-all duration-300 ${
        scrolled
          ? "bg-surface-950/95 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
          : "bg-surface-950/90 backdrop-blur-md"
      }`}
      aria-label={t("ariaLabel")}
    >
      {/* Subtle scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
        }}
      />

      {/* Nav content */}
      <div className="container mx-auto flex justify-between items-center h-full px-4 relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <span className="relative inline-block">
            <span
              className="absolute -top-2 -right-6 translate-x-1/4 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 text-orange-900 border border-yellow-200/80 select-none z-10 tracking-wide"
              style={{
                letterSpacing: "0.05em",
                boxShadow: "0 0 8px rgba(251,191,36,0.35)",
              }}
            >
              BETA
            </span>
            <span
              className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 text-transparent bg-clip-text"
              style={{ filter: "drop-shadow(0 0 10px rgba(249,115,22,0.35))" }}
            >
              BoffMedia
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center space-x-1">
          {NAV_LINKS.map(({ href, label, icon, override }) => {
            const active = inPage(href);
            return (
              <div key={href}>
                {override ? (
                  override
                ) : (
                  <InternalLink
                    app={href === "/" ? "" : null}
                    href={href}
                    className={`relative px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all duration-200 group ${
                      active
                        ? "text-primary-400 [filter:drop-shadow(0_0_6px_rgba(249,115,22,0.45))]"
                        : "text-surface-400 hover:text-surface-100"
                    }`}
                    onClick={handleMenuItemClick}
                  >
                    <span className="relative z-10">{label}</span>
                    {/* Animated underline */}
                    <span
                      className={`absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transform origin-left transition-transform duration-200 ease-out ${
                        active ? "scale-x-100" : "scale-x-0"
                      } group-hover:scale-x-100`}
                      aria-hidden="true"
                      style={
                        active
                          ? { boxShadow: "0 0 8px rgba(249,115,22,0.55)" }
                          : undefined
                      }
                    />
                  </InternalLink>
                )}
              </div>
            );
          })}
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-surface-800/70">
            {showActions ? (
              <>
                <LanguageSwitcher />
                <NotificationPopover />
                <UserAuthSection />
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />
                  <div className="w-16 h-4 bg-surface-800 rounded animate-pulse" />
                </div>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-surface-400 hover:text-surface-100 hover:bg-surface-800/50"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("openMenu")}</span>
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="bg-surface-950 border-l border-surface-800/60 w-72 p-0"
              style={{
                boxShadow: "-8px 0 40px rgba(0,0,0,0.6), -1px 0 0 rgba(249,115,22,0.08)",
              }}
            >
              {/* Mobile panel top bar */}
              <div
                className="h-[2px] bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600"
                style={{ opacity: 0.65 }}
              />

              <nav className="flex flex-col gap-1 p-5">
                <LanguageSwitcher variant="mobile" />

                <div
                  className="h-px my-3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(249,115,22,0.2), transparent)",
                  }}
                />

                {NAV_LINKS.map(({ href, label, icon, override }) => {
                  const active = inPage(href);
                  return (
                    <div key={href}>
                      {override ? (
                        override
                      ) : (
                        <InternalLink
                          app={href === "/" ? "" : null}
                          href={href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                            active
                              ? "text-primary-400 bg-primary-500/10 [filter:drop-shadow(0_0_5px_rgba(249,115,22,0.35))]"
                              : "text-surface-300 hover:text-surface-50 hover:bg-surface-800/50"
                          }`}
                          onClick={handleMenuItemClick}
                        >
                          {icon && (
                            <span className={active ? "text-primary-400" : "text-surface-500"}>
                              {icon}
                            </span>
                          )}
                          <span>{label}</span>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                          )}
                        </InternalLink>
                      )}
                    </div>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Neon bottom border */}
      <div
        className="absolute bottom-0 inset-x-0 h-[2px] transition-all duration-300"
        aria-hidden="true"
        style={{
          background: scrolled
            ? "linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.55) 25%, rgba(251,146,60,0.85) 50%, rgba(249,115,22,0.55) 75%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.18) 25%, rgba(249,115,22,0.35) 50%, rgba(249,115,22,0.18) 75%, transparent 100%)",
          boxShadow: scrolled ? "0 0 14px rgba(249,115,22,0.35), 0 0 4px rgba(249,115,22,0.5)" : "none",
        }}
      />
    </nav>
  );
}
