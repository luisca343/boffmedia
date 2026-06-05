"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ToolsMenu } from "./ToolsMenu";
import { WingullMenu } from "./WingullMenu";
import { NavMenuProvider } from "./DropdownMenu";
import { InternalLink } from "@/components/ui/navigation/Link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/primitives/sheet";
import { Icon } from "@/components/boffmedia/primitives/icon";
import LanguageSwitcher from "@/components/ui/navigation/LanguageSwitcher";

const NotificationPopover = dynamic(() => import("./NotificationPopover"), {
  ssr: false,
  loading: () => <div className="w-[38px] h-[38px] rounded-[var(--btn-radius)] bg-[var(--surface-3)] animate-pulse" />,
});

const UserAuthSection = dynamic(() => import("@/components/ui/navigation/UserAuthSection"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2">
      <div className="w-[38px] h-[38px] rounded-[var(--btn-radius)] bg-[var(--surface-3)] animate-pulse" />
      <div className="w-16 h-4 bg-[var(--surface-3)] rounded animate-pulse" />
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
    { href: "/", label: t("links.home"), icon: "home" },
    { href: "/eventos", label: t("links.events"), icon: "trophy" },
    { href: "/herramientas", label: t("links.tools"), override: <ToolsMenu /> },
    { href: "/wingull", label: t("links.pixelmonWingull"), override: <WingullMenu /> },
  ];

  useEffect(() => {
    const app = pathname.split("/")[1] || "boffmedia";
    setCurrentApp(app || null);
    setMounted(true);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
    <header
      className="fixed w-full z-50 h-[68px] flex items-center transition-all duration-[var(--dur)] ease-[var(--ease)]"
      style={{
        background: scrolled
          ? "color-mix(in srgb, var(--bg) 90%, transparent)"
          : "color-mix(in srgb, var(--bg) 78%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: scrolled
          ? "var(--hairline) solid var(--border)"
          : "var(--hairline) solid transparent",
      }}
    >
      <div className="container mx-auto flex justify-between items-center h-full px-4">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-[0.6rem] flex-shrink-0">
          <img
            src="/img/boff-logo.webp"
            alt=""
            width={34}
            height={34}
            className="rounded-[6px]"
          />
          <span className="relative font-display font-extrabold text-[1.3rem] tracking-[0.01em] text-[var(--orange-500)] pr-[2.6rem]">
            BoffMedia
            <span className="absolute -top-[0.4rem] right-0 font-mono text-[0.5rem] font-bold tracking-[0.1em] px-[0.3rem] py-[0.12rem] text-[var(--on-accent)] bg-[var(--accent-bright)] rounded-[3px]">
              BETA
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-[0.4rem]" aria-label={t("ariaLabel")}>
          <NavMenuProvider>
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
                      className={`navlink ${active ? "navlink--active" : ""}`}
                      onClick={handleMenuItemClick}
                    >
                      {icon && (
                        <Icon
                          name={icon}
                          size={17}
                        />
                      )}
                      <span>{label}</span>
                    </InternalLink>
                  )}
                </div>
              );
            })}
          </NavMenuProvider>
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {showActions ? (
              <>
                <LanguageSwitcher />
                <NotificationPopover />
                <UserAuthSection />
              </>
            ) : (
              <>
                <div className="w-[38px] h-[38px] bg-[var(--surface-3)] rounded-[var(--btn-radius)] animate-pulse" />
                <div className="w-[38px] h-[38px] bg-[var(--surface-3)] rounded-[var(--btn-radius)] animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="w-[38px] h-[38px] bg-[var(--surface-3)] rounded-[var(--btn-radius)] animate-pulse" />
                  <div className="w-16 h-4 bg-[var(--surface-3)] rounded animate-pulse" />
                </div>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="md:hidden inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] border-0 bg-transparent cursor-pointer transition-colors duration-[var(--dur)]"
              >
                <Icon name="menu" size={20} />
                <span className="sr-only">{t("openMenu")}</span>
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-72 p-0"
              style={{
                background: "var(--surface)",
                borderLeft: "var(--hairline) solid var(--border-strong)",
              }}
            >
              <nav className="flex flex-col gap-1 p-5">
                <LanguageSwitcher variant="mobile" />

                <div
                  className="h-px my-3"
                  style={{
                    background: "var(--border)",
                  }}
                />

                <NavMenuProvider>
                  {NAV_LINKS.concat([
                    { href: "/perfil", label: t("links.profile") || "Perfil", icon: "user" },
                  ]).map(({ href, label, icon, override }) => {
                    const active = inPage(href);
                    return (
                      <div key={href}>
                        {override ? (
                          override
                        ) : (
                          <InternalLink
                            app={href === "/" ? "" : null}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--btn-radius)] text-[length:var(--t-sm)] font-semibold transition-colors duration-[var(--dur)] ${
                              active
                                ? "text-[var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)]"
                                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                            }`}
                            onClick={handleMenuItemClick}
                          >
                            {icon && (
                              <Icon
                                name={icon}
                                size={20}
                                className={active ? "text-[var(--orange-500)]" : "text-[var(--text-dim)]"}
                              />
                            )}
                            <span>{label}</span>
                            <Icon name="arrow" size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </InternalLink>
                        )}
                      </div>
                    );
                  })}
                </NavMenuProvider>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
