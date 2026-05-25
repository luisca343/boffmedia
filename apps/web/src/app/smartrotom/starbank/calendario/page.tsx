"use client";

import { useState, useMemo, type ReactNode } from "react";
import { format } from "date-fns";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import useStarBank from "../_hooks/useStarBank";
import { ChartsSkeleton } from "../graficas/_components/ChartsSkeleton";
import { formatMoney } from "../bankUtils";
import { StarBankTransaction } from "@boffmedia/shared";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
} from "@heroicons/react/24/outline";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHead({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div style={{ padding: "16px 20px 12px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--sb-fg-muted, #5b6b85)",
          marginBottom: 2,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--sb-fg, #0c1830)",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function NavBtn({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "1px solid var(--sb-border, #e3ebf5)",
        background: "var(--sb-surface, #fff)",
        color: "var(--sb-fg-muted, #5b6b85)",
        cursor: "pointer",
        transition: "background 150ms",
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Calendario() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const { activeAccount } = useStarBank();
  const { transactions, isLoading } = useGetTransactions(activeAccount?.id ?? -1, 500);

  // events map: dateKey → transactions[]
  const events = useMemo<Record<string, StarBankTransaction[]>>(() => {
    if (!transactions) return {};
    const m: Record<string, StarBankTransaction[]> = {};
    transactions.forEach((tx) => {
      try {
        const dateKey = format(new Date(tx.date), "yyyy-MM-dd");
        if (!m[dateKey]) m[dateKey] = [];
        m[dateKey].push(tx);
      } catch {}
    });
    return m;
  }, [transactions]);

  // upcoming: future transactions sorted ascending; fallback to most recent
  const upcoming = useMemo<StarBankTransaction[]>(() => {
    if (!transactions) return [];
    const todayKey = format(today, "yyyy-MM-dd");
    const future = transactions
      .filter((tx) => tx.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
    if (future.length > 0) return future;
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [transactions, today]);

  // calendar cells array
  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = (first.getDay() + 6) % 7; // monday-first
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    const arr: { out: boolean; day: number }[] = [];
    for (let i = 0; i < startOffset; i++)
      arr.push({ out: true, day: daysInPrev - startOffset + 1 + i });
    for (let i = 1; i <= daysInMonth; i++) arr.push({ out: false, day: i });
    while (arr.length % 7 !== 0)
      arr.push({ out: true, day: arr.length - daysInMonth - startOffset + 1 });
    return arr;
  }, [viewYear, viewMonth]);

  function cellKey(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isTodayCell(c: { out: boolean; day: number }) {
    return (
      !c.out &&
      c.day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    );
  }

  function nav(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    while (m < 0) { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    setViewMonth(m);
    setViewYear(y);
    setSelected(null);
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const selectedEvents = selected ? (events[selected] ?? []) : [];

  if (isLoading) return <ChartsSkeleton />;

  return (
    <>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--sb-fg, #0c1830)",
              margin: 0,
            }}
          >
            Calendario de pagos
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--sb-fg-muted, #5b6b85)",
              margin: "4px 0 0",
            }}
          >
            Tus pagos programados, suscripciones e ingresos previstos
          </p>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 16px",
            borderRadius: 10,
            border: "none",
            background: "var(--sb-500, #2563eb)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <PlusIcon style={{ width: 14, height: 14 }} />
          Nuevo pago
        </button>
      </div>

      {/* 12-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* ── Left: calendar (span 8) ───────────────────────────────────── */}
        <div
          className="md:col-span-8"
          style={{
            background: "var(--sb-surface, #fff)",
            borderRadius: "var(--sb-r-xl, 16px)",
            border: "1px solid var(--sb-border, #e3ebf5)",
            overflow: "hidden",
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "18px 20px 4px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Vista mensual
              </div>
              <h3
                style={{
                  fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                  textTransform: "capitalize",
                  color: "var(--sb-fg, #0c1830)",
                }}
              >
                {monthName}
              </h3>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <NavBtn onClick={() => nav(-1)} label="Mes anterior">
                <ChevronLeftIcon style={{ width: 14, height: 14 }} />
              </NavBtn>
              <button
                onClick={() => {
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                  setSelected(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1px solid var(--sb-border, #e3ebf5)",
                  background: "var(--sb-surface, #fff)",
                  color: "var(--sb-fg-2, #2c3a55)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Hoy
              </button>
              <NavBtn onClick={() => nav(1)} label="Mes siguiente">
                <ChevronRightIcon style={{ width: 14, height: 14 }} />
              </NavBtn>
            </div>
          </div>

          {/* Calendar body */}
          <div style={{ padding: "12px 20px 20px" }}>
            {/* 7-col calendar grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
              }}
            >
              {/* Day-of-week headers */}
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--sb-fg-muted, #5b6b85)",
                    padding: "8px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {cells.map((c, i) => {
                if (c.out) {
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "6px 4px",
                        textAlign: "center",
                        color: "var(--sb-fg-muted, #5b6b85)",
                        opacity: 0.3,
                        fontSize: 13,
                      }}
                    >
                      {c.day}
                    </div>
                  );
                }

                const k = cellKey(c.day);
                const ev = events[k] ?? [];
                const isSel = selected === k;
                const isT = isTodayCell(c);

                return (
                  <button
                    key={i}
                    onClick={() => setSelected(isSel ? null : k)}
                    style={{
                      padding: "6px 4px",
                      borderRadius: 8,
                      border:
                        isT || isSel
                          ? "2px solid var(--sb-500, #2563eb)"
                          : "2px solid transparent",
                      background: isSel
                        ? "var(--sb-100, #dbeafe)"
                        : isT
                        ? "var(--sb-50, #eff6ff)"
                        : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      transition: "background 120ms",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isT || isSel ? 700 : 400,
                        color: isT
                          ? "var(--sb-600, #1d4ed8)"
                          : "var(--sb-fg, #0c1830)",
                      }}
                    >
                      {c.day}
                    </span>
                    {ev.length > 0 && (
                      <span style={{ display: "flex", gap: 2 }}>
                        {ev.slice(0, 3).map((e, j) => (
                          <span
                            key={j}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 999,
                              background: e.isPayer
                                ? "var(--sb-neg-2, #dc2626)"
                                : "var(--sb-pos-2, #059669)",
                              opacity: 0.55,
                              display: "block",
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selection panel / legend */}
            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: "var(--sb-surface-2, #f7faff)",
                borderRadius: "var(--sb-r-md, 10px)",
              }}
            >
              {selected ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 13,
                        color: "var(--sb-fg, #0c1830)",
                        textTransform: "capitalize",
                      }}
                    >
                      {new Date(selected + "T00:00:00").toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </strong>
                    <button
                      onClick={() => setSelected(null)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--sb-fg-muted, #5b6b85)",
                        fontSize: 16,
                        lineHeight: 1,
                        padding: "2px 4px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {selectedEvents.length === 0 && (
                    <div style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13 }}>
                      Sin movimientos para este día
                    </div>
                  )}
                  {selectedEvents.map((e, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px 0",
                        borderTop:
                          i > 0 ? "1px solid var(--sb-border, #e3ebf5)" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          flexShrink: 0,
                          background: e.isPayer
                            ? "var(--sb-neg-2, #dc2626)"
                            : "var(--sb-pos-2, #059669)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--sb-fg, #0c1830)",
                          }}
                        >
                          {e.reason || "Sin concepto"}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--sb-fg-muted, #5b6b85)" }}>
                          {e.isPayer ? e.toName : e.fromName} · {e.type}
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                          color: e.isPayer
                            ? "var(--sb-neg-2, #dc2626)"
                            : "var(--sb-pos-2, #059669)",
                        }}
                      >
                        {e.isPayer ? "− " : "+ "}
                        {formatMoney(e.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    fontSize: 12,
                    color: "var(--sb-fg-muted, #5b6b85)",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: "var(--sb-neg-2, #dc2626)",
                        opacity: 0.55,
                        display: "inline-block",
                      }}
                    />
                    Salida
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: "var(--sb-pos-2, #059669)",
                        display: "inline-block",
                      }}
                    />
                    Entrada
                  </span>
                  <span style={{ opacity: 0.7 }}>Pulsa un día para ver los movimientos</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: upcoming (span 4) ──────────────────────────────────── */}
        <div
          className="md:col-span-4"
          style={{
            background: "var(--sb-surface, #fff)",
            borderRadius: "var(--sb-r-xl, 16px)",
            border: "1px solid var(--sb-border, #e3ebf5)",
            overflow: "hidden",
          }}
        >
          <SectionHead title="Próximos pagos" eyebrow="Los siguientes" />
          <div>
            {upcoming.length === 0 && (
              <div style={{ padding: 20, color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13 }}>
                Sin movimientos próximos
              </div>
            )}
            {upcoming.map((tx, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderTop: "1px solid var(--sb-border, #e3ebf5)",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: tx.isPayer
                      ? "rgba(220,38,38,0.1)"
                      : "rgba(5,150,105,0.1)",
                    color: tx.isPayer
                      ? "var(--sb-neg-2, #dc2626)"
                      : "var(--sb-pos-2, #059669)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {tx.isPayer ? (
                    <ArrowDownRightIcon style={{ width: 16, height: 16 }} />
                  ) : (
                    <ArrowUpRightIcon style={{ width: 16, height: 16 }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--sb-fg, #0c1830)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tx.reason || "Transferencia"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--sb-fg-muted, #5b6b85)", marginTop: 2 }}>
                    {new Date(tx.date + "T00:00:00").toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {tx.isPayer ? tx.toName : tx.fromName}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    color: tx.isPayer
                      ? "var(--sb-fg, #0c1830)"
                      : "var(--sb-pos-2, #059669)",
                  }}
                >
                  {tx.isPayer ? "− " : "+ "}
                  {formatMoney(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
