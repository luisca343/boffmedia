"use client";
import { useState, useRef, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import useStarBank from "../_hooks/useStarBank";
import { AccountImage } from "./AccountImage";
import { useBoffSession } from "@/services/useBoffSession";
import { changeActiveAccount, formatMoney } from "../bankUtils";
import { StarBankAccount } from "@boffmedia/shared";
import Link from "next/link";

const PAGE_INFO: Record<string, { title: string; breadcrumbs: string[] }> = {
  starbank:       { title: "General",              breadcrumbs: ["Inicio"] },
  cuentas:        { title: "Cuentas",              breadcrumbs: ["Personal", "Cuentas"] },
  transacciones:  { title: "Transacciones",        breadcrumbs: ["Personal", "Movimientos"] },
  enviar:         { title: "Enviar dinero",         breadcrumbs: ["Personal", "Transferencia"] },
  graficas:       { title: "Gráficas",             breadcrumbs: ["Análisis", "Gráficas"] },
  calendario:     { title: "Calendario de pagos",  breadcrumbs: ["Análisis", "Calendario"] },
  ajustes:        { title: "Ajustes",              breadcrumbs: ["Cuenta", "Ajustes"] },
};

export default function TopBar({
  currentPage,
  onToggleSidebar,
  theme,
  onToggleTheme,
}: Readonly<{
  currentPage: string;
  onToggleSidebar?: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}>) {
  const { accounts, activeAccount, setActiveAccount } = useStarBank();
  const { session } = useBoffSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageInfo = PAGE_INFO[currentPage] ?? PAGE_INFO.starbank;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAccountChange = (account: StarBankAccount) => {
    if (account?.id) {
      changeActiveAccount(account.id);
      setActiveAccount(account.id);
      setShowDropdown(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center shrink-0"
      style={{
        gap: 16,
        padding: "14px 28px",
        background: "var(--sb-topbar-bg, rgba(255,255,255,0.85))",
        backdropFilter: "saturate(140%) blur(10px)",
        WebkitBackdropFilter: "saturate(140%) blur(10px)",
        borderBottom: "1px solid var(--sb-border, #e3ebf5)",
      }}
    >
      {/* Sidebar toggle */}
      <button
        className="grid place-items-center rounded-[14px] border transition-colors"
        style={{
          width: 38,
          height: 38,
          color: "var(--sb-fg-2, #2c3a55)",
          borderColor: "var(--sb-border, #e3ebf5)",
          background: "var(--sb-surface, #ffffff)",
          flexShrink: 0,
        }}
        onClick={onToggleSidebar}
        aria-label="Alternar menú lateral"
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-surface, #ffffff)"; }}
      >
        <Bars3Icon style={{ width: 18, height: 18 }} />
      </button>

      {/* Breadcrumbs + title */}
      <div className="shrink-0">
        <div style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)", lineHeight: 1.3 }}>
          {pageInfo.breadcrumbs.map((crumb, i) => (
            <span key={crumb}>
              {i > 0 && " / "}
              <strong style={{ color: "var(--sb-fg-2, #2c3a55)", fontWeight: 600 }}>
                {crumb}
              </strong>
            </span>
          ))}
        </div>
        <div
          className="font-semibold"
          style={{
            fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
            fontSize: 18,
            letterSpacing: "-0.01em",
            color: "var(--sb-fg, #0c1830)",
            lineHeight: 1.2,
          }}
        >
          {pageInfo.title}
        </div>
      </div>

      {/* Global search */}
      <div className="relative flex-1" style={{ maxWidth: 420 }}>
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ width: 16, height: 16, color: "var(--sb-fg-subtle, #8d99b3)" }}
          aria-hidden
        />
        <input
          className="w-full pr-16 rounded-[14px] border text-[14px] outline-none transition-colors"
          style={{
            height: 38,
            paddingLeft: 36,
            background: "var(--sb-surface-2, #f7faff)",
            borderColor: "var(--sb-border, #e3ebf5)",
            color: "var(--sb-fg, #0c1830)",
          }}
          placeholder="Buscar transacciones, cuentas, contactos…"
          aria-label="Buscar"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--sb-400, #60a5fa)";
            e.currentTarget.style.background = "var(--sb-surface, #ffffff)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
            e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
          }}
        />
        <span
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] border text-[10px] px-1.5 py-0.5"
          style={{
            color: "var(--sb-fg-subtle, #8d99b3)",
            borderColor: "var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #ffffff)",
          }}
          aria-hidden
        >
          ⌘K
        </span>
      </div>

      {/* Action cluster */}
      <div className="ml-auto flex items-center" style={{ gap: 8 }}>
        {/* Theme toggle */}
        <button
          className="grid place-items-center rounded-[14px] border transition-colors"
          style={{
            width: 38,
            height: 38,
            color: "var(--sb-fg-2, #2c3a55)",
            borderColor: "var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #ffffff)",
          }}
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-surface, #ffffff)"; }}
        >
          {theme === "dark"
            ? <SunIcon style={{ width: 16, height: 16 }} />
            : <MoonIcon style={{ width: 16, height: 16 }} />
          }
        </button>

        {/* Notification bell */}
        <button
          className="relative grid place-items-center rounded-[14px] border transition-colors"
          style={{
            width: 38,
            height: 38,
            color: "var(--sb-fg-2, #2c3a55)",
            borderColor: "var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #ffffff)",
          }}
          aria-label="Notificaciones"
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-surface, #ffffff)"; }}
        >
          <BellIcon style={{ width: 16, height: 16 }} />
          <span
            className="absolute rounded-full"
            style={{
              top: 8,
              right: 9,
              width: 8,
              height: 8,
              background: "var(--sb-neg-2, #dc2626)",
              boxShadow: "0 0 0 2px var(--sb-surface, #ffffff)",
            }}
            aria-hidden
          />
        </button>

        {/* Account chip */}
        <div className="relative" ref={dropdownRef}>
          {activeAccount && (
            <button
              className="flex items-center rounded-full border transition-colors"
              style={{
                gap: 10,
                padding: "4px 10px 4px 4px",
                borderColor: "var(--sb-border, #e3ebf5)",
                background: "var(--sb-surface, #ffffff)",
              }}
              onClick={() => setShowDropdown((v) => !v)}
              aria-label="Cuenta activa"
              aria-expanded={showDropdown}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-surface, #ffffff)"; }}
            >
              <span
                className="rounded-full overflow-hidden"
                style={{
                  width: 30,
                  height: 30,
                  background: "var(--sb-100, #dbeafe)",
                  display: "block",
                  flexShrink: 0,
                }}
              >
                <AccountImage
                  width={30}
                  height={30}
                  type={activeAccount.type}
                  name={activeAccount.name}
                  image={(activeAccount as any).image}
                />
              </span>
              <div className="hidden sm:block text-left leading-none">
                <div
                  className="font-semibold"
                  style={{ fontSize: 12.5, color: "var(--sb-fg, #0c1830)" }}
                >
                  {session?.user?.name ?? activeAccount.name}
                </div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: 11, color: "var(--sb-fg-muted, #5b6b85)" }}
                >
                  {formatMoney(activeAccount.balance)}
                </div>
              </div>
              <ChevronDownIcon
                style={{
                  width: 14,
                  height: 14,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms cubic-bezier(.2,.8,.2,1)",
                }}
              />
            </button>
          )}

          {/* Account dropdown */}
          {showDropdown && (
            <div
              className="absolute top-full right-0 mt-2 w-64 z-50 py-2 overflow-hidden"
              style={{
                borderRadius: 14,
                border: "1px solid var(--sb-border, #e3ebf5)",
                background: "var(--sb-surface, #ffffff)",
                boxShadow: "0 1px 0 rgba(15,30,60,.03), 0 6px 18px -8px rgba(15,30,60,.15)",
              }}
            >
              <div
                className="px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--sb-border, #e3ebf5)" }}
              >
                <p
                  className="font-semibold"
                  style={{ fontSize: 13, color: "var(--sb-fg, #0c1830)" }}
                >
                  {session?.user?.name ?? "Usuario"}
                </p>
                <p style={{ fontSize: 11, color: "var(--sb-fg-muted, #5b6b85)" }}>
                  Cambiar cuenta
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {accounts?.map((account: StarBankAccount) => (
                  <div
                    key={account.id}
                    className="flex items-center px-4 py-2 cursor-pointer transition-colors"
                    style={{
                      background:
                        activeAccount?.id === account.id
                          ? "var(--sb-surface-2, #f7faff)"
                          : undefined,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        activeAccount?.id === account.id
                          ? "var(--sb-surface-2, #f7faff)"
                          : "transparent";
                    }}
                    onClick={() => handleAccountChange(account)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleAccountChange(account)}
                  >
                    <div
                      className="shrink-0 mr-3 rounded-full overflow-hidden"
                      style={{ width: 32, height: 32 }}
                    >
                      <AccountImage
                        width={32}
                        height={32}
                        type={account.type}
                        name={account.name}
                        image={(account as any).image}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold truncate"
                        style={{ fontSize: 13, color: "var(--sb-fg, #0c1830)" }}
                      >
                        {account.name}
                      </p>
                      <p
                        className="tabular-nums"
                        style={{ fontSize: 11, color: "var(--sb-fg-muted, #5b6b85)" }}
                      >
                        {formatMoney(account.balance)}
                      </p>
                    </div>
                    {activeAccount?.id === account.id && (
                      <span
                        className="shrink-0 ml-2 rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          background: "var(--sb-pos-2, #059669)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid var(--sb-border, #e3ebf5)", paddingTop: 4 }}>
                <Link
                  href="/smartrotom/starbank/cuentas"
                  className="block px-4 py-2 transition-colors"
                  style={{ fontSize: 13, color: "var(--sb-600, #2463eb)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Gestionar cuentas
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
