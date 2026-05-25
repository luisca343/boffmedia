"use client";

import { useState, useMemo, type ReactNode } from "react";
import TransactionCharts from "./_components/TransactionCharts";
import TransactionTypeDistribution from "./_components/TransactionTypeDistribution";
import useStarBank from "../_hooks/useStarBank";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { ChartsSkeleton } from "./_components/ChartsSkeleton";
import { formatMoney } from "../bankUtils";
import { StarBankTransaction } from "@boffmedia/shared";
import {
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const RANGES = [
  { id: "7d",  label: "7 días",  days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "90d", label: "90 días", days: 90 },
  { id: "1y",  label: "1 año",   days: 365 },
] as const;

type RangeId = typeof RANGES[number]["id"];

export default function Graficas() {
  const [range, setRange] = useState<RangeId>("30d");
  const { accounts, activeAccount } = useStarBank();
  const { transactions, isLoading, error } = useGetTransactions(activeAccount?.id ?? -1);

  const days = RANGES.find((r) => r.id === range)!.days;

  const filteredTransactions: StarBankTransaction[] = useMemo(() => {
    if (!transactions) return [];
    const cutoff = Date.now() - days * 86400000;
    return transactions.filter((t: StarBankTransaction) => new Date(t.date).getTime() >= cutoff);
  }, [transactions, days]);

  const income = useMemo(
    () => filteredTransactions.filter((t) => !t.isPayer).reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );
  const expense = useMemo(
    () => filteredTransactions.filter((t) => t.isPayer).reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );
  const avgTx = filteredTransactions.length
    ? (income + expense) / filteredTransactions.length
    : 0;
  const largestExp = Math.max(
    0,
    ...filteredTransactions.filter((t) => t.isPayer).map((t) => t.amount),
  );

  // Last 14 days activity for mini bar chart
  const activityBars = useMemo(() => {
    const counts: Record<string, number> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      counts[d] = 0;
    }
    filteredTransactions.forEach((t) => {
      const d = new Date(t.date).toISOString().slice(0, 10);
      if (d in counts) counts[d]++;
    });
    const vals = Object.values(counts);
    const max = Math.max(...vals, 1);
    return vals.map((v) => Math.max(8, (v / max) * 80));
  }, [filteredTransactions]);

  if (!accounts || isLoading) return <ChartsSkeleton />;
  if (error) {
    return (
      <main style={{ padding: "24px 28px" }}>
        <p style={{ color: "var(--sb-neg-2, #dc2626)", fontSize: 14 }}>{error}</p>
      </main>
    );
  }

  const accountName = activeAccount?.name?.replace(/_/g, " ") ?? "";

  return (
    <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
              fontWeight: 600,
              fontSize: 28,
              letterSpacing: "-0.02em",
              color: "var(--sb-fg, #0c1830)",
              margin: 0,
            }}
          >
            Gráficas y análisis
          </h1>
          <p style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13.5, marginTop: 4 }}>
            Visualización de {accountName} · {filteredTransactions.length} transacciones
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Range segmented control */}
          <div
            role="tablist"
            style={{
              display: "inline-flex",
              background: "var(--sb-surface-2, #f7faff)",
              padding: 3,
              borderRadius: 10,
              border: "1px solid var(--sb-border, #e3ebf5)",
            }}
          >
            {RANGES.map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={range === r.id}
                onClick={() => setRange(r.id)}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 7,
                  color: range === r.id ? "var(--sb-fg, #0c1830)" : "var(--sb-fg-muted, #5b6b85)",
                  background: range === r.id ? "var(--sb-surface, #fff)" : "transparent",
                  boxShadow:
                    range === r.id ? "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))" : "none",
                  whiteSpace: "nowrap",
                  transition: "all 150ms ease",
                  cursor: "pointer",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid var(--sb-border, #e3ebf5)",
              background: "var(--sb-surface, #fff)",
              color: "var(--sb-fg, #0c1830)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--sb-surface, #fff)";
            }}
          >
            <ArrowDownTrayIcon style={{ width: 14, height: 14 }} />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        <KpiCard
          label="Ingresos"
          value={formatMoney(income)}
          icon={<ArrowUpRightIcon style={{ width: 16, height: 16 }} />}
          tone="pos"
          sub={`${filteredTransactions.filter((t) => !t.isPayer).length} entradas`}
        />
        <KpiCard
          label="Gastos"
          value={formatMoney(expense)}
          icon={<ArrowDownRightIcon style={{ width: 16, height: 16 }} />}
          tone="neg"
          sub={`${filteredTransactions.filter((t) => t.isPayer).length} salidas`}
        />
        <KpiCard
          label="Transacción media"
          value={formatMoney(Math.round(avgTx))}
          icon={<ChartBarIcon style={{ width: 16, height: 16 }} />}
          sub={`${filteredTransactions.length} operaciones`}
        />
      </div>

      {/* Row 1: Balance chart (8/12) + Mayor gasto (4/12) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {/* Balance evolution */}
        <div
          style={{
            gridColumn: "span 8",
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            overflow: "hidden",
            boxShadow: "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))",
          }}
        >
          <SectionHead title="Evolución de balance" eyebrow={`Últimos ${days} días`} />
          <div style={{ padding: "0 20px 20px" }}>
            {filteredTransactions.length > 1 ? (
              <TransactionCharts
                transactions={filteredTransactions}
                activeAccount={activeAccount}
                chartType="balance"
              />
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* Mayor gasto */}
        <div
          style={{
            gridColumn: "span 4",
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            overflow: "hidden",
            boxShadow: "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SectionHead title="Mayor gasto" eyebrow="Período" />
          <div
            style={{
              padding: "0 20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
            }}
          >
            <div
              style={{
                fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
                color: "var(--sb-fg, #0c1830)",
              }}
            >
              {formatMoney(largestExp)}
            </div>
            <p style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13 }}>
              Operación más alta de salida en el período seleccionado.
            </p>
            <div
              style={{ height: 1, background: "var(--sb-border, #e3ebf5)", marginBlock: 4 }}
            />
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--sb-fg-muted, #5b6b85)",
                marginBottom: 8,
              }}
            >
              Días con más actividad
            </p>
            {/* Mini bar chart */}
            <div
              style={{
                display: "flex",
                gap: 3,
                height: 80,
                alignItems: "flex-end",
                width: "100%",
              }}
            >
              {activityBars.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: h,
                    background:
                      i === activityBars.length - 1
                        ? "var(--sb-600, #2463eb)"
                        : "var(--sb-200, #bfdbfe)",
                    borderRadius: 4,
                    transition: "height 300ms ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Income vs Expenses (6/12) + Distribution (6/12) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {/* Ingresos vs Gastos bar chart */}
        <div
          style={{
            gridColumn: "span 6",
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            overflow: "hidden",
            boxShadow: "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))",
          }}
        >
          <SectionHead title="Ingresos vs. gastos" eyebrow="Por semana" />
          <div style={{ padding: "0 20px 20px" }}>
            {filteredTransactions.length > 0 ? (
              <>
                <TransactionCharts
                  transactions={filteredTransactions}
                  activeAccount={activeAccount}
                  chartType="inout"
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 16,
                    paddingTop: 8,
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: "var(--sb-pos-2, #059669)",
                        display: "inline-block",
                      }}
                    />
                    Ingresos
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: "var(--sb-neg-2, #dc2626)",
                        display: "inline-block",
                      }}
                    />
                    Gastos
                  </span>
                </div>
              </>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* Distribution */}
        <div
          style={{
            gridColumn: "span 6",
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            overflow: "hidden",
            boxShadow: "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))",
          }}
        >
          <SectionHead title="Distribución de transacciones" eyebrow="Período" />
          <div style={{ padding: "0 20px 20px" }}>
            {filteredTransactions.length > 0 && activeAccount ? (
              <TransactionTypeDistribution
                transactions={filteredTransactions}
                activeAccount={activeAccount}
              />
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function SectionHead({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div
      style={{
        padding: "16px 20px 12px",
        borderBottom: "1px solid var(--sb-border, #e3ebf5)",
        marginBottom: 16,
      }}
    >
      {eyebrow && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--sb-fg-muted, #5b6b85)",
            marginBottom: 2,
          }}
        >
          {eyebrow}
        </p>
      )}
      <h3
        style={{
          fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--sb-fg, #0c1830)",
          margin: 0,
        }}
      >
        {title}
      </h3>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid var(--sb-border, #e3ebf5)",
        background: "var(--sb-surface, #fff)",
        padding: "18px 20px",
        boxShadow: "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}>{label}</span>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 28,
            height: 28,
            borderRadius: 8,
            background:
              tone === "pos"
                ? "var(--sb-pos-soft, rgba(5,150,105,.1))"
                : tone === "neg"
                  ? "var(--sb-neg-soft, rgba(220,38,38,.1))"
                  : "var(--sb-surface-2, #f7faff)",
            color:
              tone === "pos"
                ? "var(--sb-pos-2, #059669)"
                : tone === "neg"
                  ? "var(--sb-neg-2, #dc2626)"
                  : "var(--sb-fg-muted, #5b6b85)",
          }}
        >
          {icon}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
          color: "var(--sb-fg, #0c1830)",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}>{sub}</div>}
    </div>
  );
}

function EmptyChart() {
  return (
    <div
      style={{
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--sb-fg-muted, #5b6b85)",
        fontSize: 13,
      }}
    >
      No hay datos para el período seleccionado
    </div>
  );
}
