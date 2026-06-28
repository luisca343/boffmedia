"use client";

import React, {
  useState,
  useRef,
  useContext,
  createContext,
  useCallback,
  useId,
} from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useBoffSession } from "@/services/useBoffSession";
import type { UserRole } from "@boffmedia/shared/roles";

// ─── Shared nav-menu context ──────────────────────────────────────────────────
//
// Single source of truth for which dropdown is currently open.
// All CustomDropdownMenu instances within a NavMenuProvider share one timer
// and one activeId value.
//
// Why this solves the overlap:
//   - openMenu(id)     → sets activeId = id immediately; all other menus whose
//                         isOpen depends on (activeId === theirId) become false
//                         in the same React render — no overlap window.
//   - scheduleClose()  → only runs when the cursor leaves the entire nav area.
//                         On the way from menu A to menu B, cancelClose() fires
//                         first (via B's onMouseEnter), so the timer never lands.

interface NavMenuContextValue {
  activeId: string | null;
  openMenu: (id: string) => void;
  dismissMenu: (id: string) => void;
  scheduleClose: () => void;
  cancelClose: () => void;
}

const NavMenuContext = createContext<NavMenuContextValue | null>(null);

export function NavMenuProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Open a specific menu — immediately closes any sibling that was open.
  const openMenu = useCallback(
    (id: string) => {
      cancelClose();
      setActiveId(id);
    },
    [cancelClose],
  );

  // Instant close used on click navigation (no delay wanted).
  const dismissMenu = useCallback(
    (id: string) => {
      cancelClose();
      setActiveId((prev) => (prev === id ? null : prev));
    },
    [cancelClose],
  );

  // Delayed close used when the cursor leaves the entire nav-menu area.
  // The delay bridges the pt-2 gap between trigger and panel so the menu
  // doesn't flicker closed while the cursor is in transit.
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveId(null), 120);
  }, [cancelClose]);

  return (
    <NavMenuContext.Provider
      value={{ activeId, openMenu, dismissMenu, scheduleClose, cancelClose }}
    >
      {children}
    </NavMenuContext.Provider>
  );
}

function useNavMenu(): NavMenuContextValue {
  const ctx = useContext(NavMenuContext);
  if (!ctx) throw new Error("CustomDropdownMenu must be rendered inside <NavMenuProvider>.");
  return ctx;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  roles?: UserRole[];
  isExternal?: boolean;
}

export interface MenuSectionProps {
  title?: string;
  href?: string;
  icon?: React.ReactNode;
  items: MenuItemProps[];
  description?: string;
}

interface CustomDropdownMenuProps {
  triggerLabel: string;
  mainLink?: MenuItemProps;
  sections: MenuSectionProps[];
}

const MotionLink = motion(Link);

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomDropdownMenu({ triggerLabel, mainLink, sections }: CustomDropdownMenuProps) {
  // Stable ID that matches between SSR and client — no hydration issues.
  const id = useId();
  const { activeId, openMenu, dismissMenu, scheduleClose, cancelClose } = useNavMenu();
  const { hasRole } = useBoffSession();

  // Derived — never stored locally, so it can never be stale.
  const isOpen = activeId === id;

  const handleMouseEnter = () => {
    // cancelClose prevents the shared timer from closing the menu we're
    // entering; openMenu(id) immediately deactivates any sibling.
    cancelClose();
    openMenu(id);
  };

  const handleMouseLeave = () => {
    // Schedule a close only for the case where the cursor leaves the nav
    // area entirely. If the cursor moves into a sibling, that sibling's
    // handleMouseEnter will cancel this before it fires.
    scheduleClose();
  };

  const handleNavigate = () => dismissMenu(id);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <button
        className="navlink group"
        onClick={() => (isOpen ? dismissMenu(id) : openMenu(id))}
      >
        {mainLink ? (
          <Link href={mainLink.href} className="flex items-center gap-1" onClick={handleNavigate}>
            {mainLink.label}
            <ChevronDown
              className="h-3 w-3 opacity-50 transition-transform duration-200 group-hover:opacity-80"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </Link>
        ) : (
          <>
            {triggerLabel}
            <ChevronDown
              className="ml-1 h-3 w-3 opacity-50 transition-transform duration-200 group-hover:opacity-80"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </>
        )}
      </button>

      {/* Panel — pt-2 keeps the visual spacing inside the hover zone so the
          cursor never exits the parent div while crossing to the panel. */}
      {isOpen && (
        <div className="absolute top-full z-50 w-60 pt-2">
          <div
            className="border border-edge rounded-lg overflow-hidden backdrop-blur-xl"
            style={{
              background: "var(--layer-1)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Top neon bar */}
            <div
              className="h-[2px] bg-gradient-to-r from-primary-active via-primary-hover to-primary-active"
              style={{ opacity: 0.7 }}
            />

            <div className="py-1">
              {/* Optional main-link header */}
              {mainLink && (
                <>
                  <Link
                    href={mainLink.href}
                    className="flex items-center gap-2 px-3 py-2 mx-1 rounded-[var(--radius)] transition-colors duration-[var(--dur)] hover:bg-[color-mix(in_srgb,var(--orange-500)_8%,transparent)] group"
                    onClick={handleNavigate}
                  >
                    {mainLink.icon && (
                      <span className="text-[var(--orange-500)]/60 group-hover:text-[var(--orange-500)] transition-colors flex-shrink-0">
                        {mainLink.icon}
                      </span>
                    )}
                      <div>
                        <div
                          className="text-sm font-bold text-ink group-hover:text-[var(--orange-400)] transition-colors leading-tight font-display"
                        >
                          {mainLink.label}
                        </div>
                        {mainLink.description && (
                          <div className="text-xs text-ink-dim mt-0.5">
                          {mainLink.description}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div
                    className="h-px mx-2 my-0.5"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--border), transparent)",
                    }}
                  />
                </>
              )}

              {sections.map((section, index) => (
                <React.Fragment key={`${section.title ?? ""}-${index}`}>
                  {index > 0 && (
                      <div
                        className="h-px mx-2 my-0.5"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, var(--border), transparent)",
                        }}
                      />
                  )}

                  {section.title && (
                    section.href ? (
                      <Link
                        href={section.href}
                        className="flex items-center justify-between px-3 pt-1.5 pb-0.5 text-[10px] font-mono uppercase tracking-widest transition-colors duration-[var(--dur)] group text-[var(--orange-500)]"
                        onClick={handleNavigate}
                      >
                        <span className="flex items-center gap-1">
                          {section.icon && <span className="opacity-70 [&_svg]:w-3 [&_svg]:h-3">{section.icon}</span>}
                          {section.title}
                        </span>
                        <ChevronRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-80 transition-opacity" />
                      </Link>
                    ) : (
                      <h3
                        className="flex items-center gap-1 px-3 pt-1.5 pb-0.5 text-[10px] font-mono uppercase tracking-widest text-ink-dim"
                      >
                        {section.icon && <span className="opacity-60 [&_svg]:w-3 [&_svg]:h-3">{section.icon}</span>}
                        {section.title}
                      </h3>
                    )
                  )}

                  <div className="pb-0.5">
                    {section.items
                      .filter((item) => !item.roles || hasRole(item.roles))
                      .map((item, itemIndex) => (
                        <MotionLink
                          href={item.href}
                          className="flex items-center gap-2 mx-1 px-2 py-1.5 rounded-[var(--radius)] text-xs text-ink-muted hover:text-ink hover:bg-[color-mix(in_srgb,var(--orange-500)_7%,transparent)] transition-colors duration-[var(--dur)] group"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.12, delay: itemIndex * 0.025 }}
                          key={`${section.title ?? ""}-${item.href}-${itemIndex}`}
                          onClick={handleNavigate}
                          target={item.isExternal ? "_blank" : undefined}
                          rel={item.isExternal ? "noopener noreferrer" : undefined}
                        >
                          {item.icon && (
                            <span className="text-[var(--orange-500)]/55 group-hover:text-[var(--orange-500)] transition-colors flex-shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5">
                              {item.icon}
                            </span>
                          )}
                          <span className="flex-1 leading-tight truncate">{item.label}</span>
                          <ChevronRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                        </MotionLink>
                      ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
