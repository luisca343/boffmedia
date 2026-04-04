"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { motion } from "framer-motion";
import { useBoffSession } from "@/services/useBoffSession";

interface MenuItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  roles?: string[];
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

export function CustomDropdownMenu({ triggerLabel, mainLink, sections }: CustomDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hasRole } = useBoffSession();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 120);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <Button
        variant="ghost"
        className="px-2 py-1 z-20 text-surface-300 hover:text-primary-300 hover:bg-surface-800/40 text-sm group transition-colors duration-150"
        onClick={() => setIsOpen(!isOpen)}
      >
        {mainLink ? (
          <Link href={mainLink.href} className="flex items-center gap-1" onClick={closeMenu}>
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
      </Button>

      {/* Panel — pt-2 keeps the visual gap inside the hover zone so the cursor
          never exits the parent div while crossing from trigger to panel. */}
      {isOpen && (
        <div className="absolute top-full z-50 w-72 pt-2">
          <div
            className="border rounded-lg overflow-hidden backdrop-blur-xl"
            style={{
              background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
              borderColor: "rgba(249,115,22,0.18)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(249,115,22,0.04), 0 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top neon bar */}
            <div
              className="h-[2px] bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600"
              style={{ opacity: 0.7 }}
            />

            <div className="py-1.5">
              {/* Optional main-link header */}
              {mainLink && (
                <>
                  <Link
                    href={mainLink.href}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 mx-1.5 rounded-md transition-all duration-150 hover:bg-primary-500/[0.08] group"
                    onClick={closeMenu}
                  >
                    {mainLink.icon && (
                      <span className="text-primary-400/60 group-hover:text-primary-400 transition-colors flex-shrink-0">
                        {mainLink.icon}
                      </span>
                    )}
                    <div>
                      <div
                        className="text-sm font-bold text-surface-100 group-hover:text-primary-200 transition-colors leading-tight"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        {mainLink.label}
                      </div>
                      {mainLink.description && (
                        <div className="text-xs text-surface-500 mt-0.5">{mainLink.description}</div>
                      )}
                    </div>
                  </Link>
                  <div
                    className="h-px mx-3 my-1"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(249,115,22,0.18), transparent)",
                    }}
                  />
                </>
              )}

              {sections.map((section, index) => (
                <React.Fragment key={`${section.title ?? ""}-${index}`}>
                  {/* Section divider */}
                  {index > 0 && (
                    <div
                      className="h-px mx-3 my-1"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(71,85,105,0.35), transparent)",
                      }}
                    />
                  )}

                  {/* Section title */}
                  {section.title && (
                    section.href ? (
                      <Link
                        href={section.href}
                        className="flex items-center justify-between px-3.5 pt-2 pb-1 text-xs font-mono uppercase tracking-widest transition-colors duration-150 group"
                        style={{
                          color: "rgba(251,146,60,0.72)",
                          fontFamily: "Orbitron, sans-serif",
                        }}
                        onClick={closeMenu}
                      >
                        <span className="flex items-center gap-1.5">
                          {section.icon && (
                            <span className="opacity-80">{section.icon}</span>
                          )}
                          {section.title}
                        </span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-80 transition-opacity" />
                      </Link>
                    ) : (
                      <h3
                        className="flex items-center gap-1.5 px-3.5 pt-2 pb-1 text-xs font-mono uppercase tracking-widest"
                        style={{
                          color: "rgba(100,116,139,0.75)",
                          fontFamily: "Orbitron, sans-serif",
                        }}
                      >
                        {section.icon && <span className="opacity-70">{section.icon}</span>}
                        {section.title}
                      </h3>
                    )
                  )}

                  {/* Items */}
                  <div className="pb-0.5">
                    {section.items
                      .filter((item) => !item.roles || hasRole(item.roles))
                      .map((item, itemIndex) => (
                        <MotionLink
                          href={item.href}
                          className="flex items-center gap-2.5 mx-1.5 px-2.5 py-2 rounded-md text-sm text-surface-300 hover:text-surface-50 hover:bg-primary-500/[0.07] transition-colors duration-150 group"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.12, delay: itemIndex * 0.025 }}
                          key={`${section.title ?? ""}-${item.href}-${itemIndex}`}
                          onClick={closeMenu}
                          target={item.isExternal ? "_blank" : undefined}
                          rel={item.isExternal ? "noopener noreferrer" : undefined}
                        >
                          {item.icon && (
                            <span className="text-primary-400/55 group-hover:text-primary-400/90 transition-colors flex-shrink-0">
                              {item.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="leading-tight truncate">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-surface-500 mt-0.5 truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
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
