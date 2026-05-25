"use client";
import Link from "next/link";
import {
  HomeIcon,
  CreditCardIcon,
  BanknotesIcon,
  ListBulletIcon,
  ChartBarIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowsRightLeftIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import useStarBank from "../_hooks/useStarBank";
import { AccountImage } from "./AccountImage";
import { formatMoney } from "../bankUtils";

const NAV_GROUPS = [
  {
    group: "Personal",
    items: [
      { id: "starbank", label: "General",        Icon: HomeIcon,       url: "starbank" },
      { id: "cuentas",  label: "Cuentas",         Icon: CreditCardIcon,  url: "starbank/cuentas" },
      { id: "transacciones", label: "Transacciones", Icon: ListBulletIcon, url: "starbank/transacciones" },
      { id: "enviar",   label: "Enviar Dinero",   Icon: BanknotesIcon,  url: "starbank/enviar" },
    ],
  },
  {
    group: "Análisis",
    items: [
      { id: "graficas",   label: "Gráficas",   Icon: ChartBarIcon,  url: "starbank/graficas" },
      { id: "calendario", label: "Calendario", Icon: CalendarIcon,  url: "starbank/calendario", badge: 3 },
    ],
  },
  {
    group: "Cuenta",
    items: [
      { id: "ajustes", label: "Ajustes", Icon: Cog6ToothIcon, url: "starbank/ajustes" },
    ],
  },
] as const;

interface SideMenuProps {
  currentPage: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const SideMenu = ({ currentPage, isCollapsed, onToggle }: SideMenuProps) => {
  const { activeAccount } = useStarBank();

  return (
    <aside
      className="relative h-full shrink-0 flex flex-col overflow-hidden"
      style={{
        width: isCollapsed ? 76 : 256,
        transition: "width 280ms cubic-bezier(.2,.8,.2,1)",
        background: "linear-gradient(180deg, #0b1638 0%, #172554 60%, #1e3a8a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 14px",
        color: "#c8d4ec",
        gap: 8,
      }}
    >
      {/* ── Brand ── */}
      <div
        className="flex items-center shrink-0"
        style={{
          gap: 10,
          padding: "6px 8px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 10,
        }}
      >
        {/* Logo mark */}
        <div
          className="shrink-0 grid place-items-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background:
              "conic-gradient(from 220deg, #93c5fd, #2463eb 35%, #1e3a8a 70%, #93c5fd)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.18), 0 6px 20px -8px rgba(59,130,246,.8)",
          }}
          aria-hidden
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l2.5 5.5L20 9.5l-4 4 1 5.5L12 16.5 7 19l1-5.5-4-4 5.5-1L12 3Z" />
          </svg>
        </div>

        {!isCollapsed && (
          <div style={{ lineHeight: 1.2 }}>
            <div
              className="font-bold tracking-tight text-white"
              style={{
                fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              Starbank
            </div>
            <small
              className="font-medium uppercase"
              style={{
                display: "block",
                fontSize: 10,
                color: "#9bb3da",
                letterSpacing: "0.14em",
              }}
            >
              SmartRotom · Beta
            </small>
          </div>
        )}
      </div>

      {/* ── Account quick-switcher ── */}
      <Link
        href="/smartrotom/starbank/cuentas"
        className="shrink-0 flex items-center rounded-[14px] transition-colors hover:bg-white/10"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          padding: isCollapsed ? "6px" : "12px",
          gap: 10,
          justifyContent: isCollapsed ? "center" : undefined,
        }}
      >
        <div
          className="shrink-0 rounded-[10px] overflow-hidden"
          style={{
            width: 36,
            height: 36,
            background: "#fff",
            boxShadow: "0 0 0 2px rgba(255,255,255,.1)",
          }}
        >
          {activeAccount && (
            <AccountImage
              width={36}
              height={36}
              type={activeAccount.type}
              name={activeAccount.name}
              image={(activeAccount as any).image}
            />
          )}
        </div>

        {!isCollapsed && (
          <>
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="font-semibold text-white truncate"
                style={{ fontSize: 13 }}
              >
                {activeAccount?.name ?? "Cuenta"}
              </span>
              <span
                className="tabular-nums"
                style={{ fontSize: 12, color: "#9bb3da" }}
              >
                {formatMoney(activeAccount?.balance ?? 0)}
              </span>
            </div>
            <span
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "#9bb3da" }}
              aria-label="Cambiar cuenta"
            >
              <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
            </span>
          </>
        )}
      </Link>

      {/* ── Navigation groups ── */}
      <nav className="flex flex-col flex-1 overflow-y-auto" style={{ gap: 0 }}>
        {NAV_GROUPS.map((g) => (
          <div key={g.group} className="flex flex-col">
            {/* Group label */}
            {!isCollapsed ? (
              <div
                className="font-semibold uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: "#6e84ab",
                  padding: "14px 12px 6px",
                }}
              >
                {g.group}
              </div>
            ) : (
              <div style={{ height: 14 }} />
            )}

            {/* Items */}
            <div className="flex flex-col" style={{ gap: 2 }}>
              {g.items.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <Link
                    key={item.id}
                    href={`/smartrotom/${item.url}`}
                    className="relative flex items-center rounded-[10px] font-medium"
                    style={{
                      gap: isCollapsed ? 0 : 12,
                      padding: isCollapsed ? "10px" : "9px 12px",
                      justifyContent: isCollapsed ? "center" : undefined,
                      fontSize: 13.5,
                      color: isActive ? "#fff" : "#b2c0dc",
                      background: isActive
                        ? "linear-gradient(90deg, rgba(59,130,246,.22), rgba(59,130,246,.06))"
                        : undefined,
                      transition: "background 200ms cubic-bezier(.2,.8,.2,1), color 200ms cubic-bezier(.2,.8,.2,1)",
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Active left-bar indicator */}
                    {isActive && (
                      <span
                        className="absolute left-0 rounded-r-[4px]"
                        style={{
                          width: 3,
                          top: 8,
                          bottom: 8,
                          background: "#60a5fa",
                        }}
                        aria-hidden
                      />
                    )}

                    <item.Icon
                      className="shrink-0"
                      style={{ width: 18, height: 18 }}
                      strokeWidth={1.6}
                    />

                    {!isCollapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}

                    {"badge" in item && !isCollapsed && item.badge != null && (
                      <span
                        className="text-white font-bold"
                        style={{
                          background: "#3b82f6",
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 999,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer status + collapse toggle ── */}
      <div
        className="shrink-0 flex items-center pt-3"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          gap: 8,
          color: "#8597b6",
          fontSize: 12,
        }}
      >
        {/* Online dot */}
        <span
          className="shrink-0 rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "#059669",
            boxShadow: "0 0 0 3px rgba(5,150,105,.25)",
          }}
          aria-hidden
        />

        {!isCollapsed && (
          <span className="flex-1 truncate">Sistema operativo</span>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
          style={{ color: "#8597b6" }}
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <ChevronLeftIcon
            style={{
              width: 14,
              height: 14,
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 280ms cubic-bezier(.2,.8,.2,1)",
            }}
          />
        </button>
      </div>
    </aside>
  );
};
