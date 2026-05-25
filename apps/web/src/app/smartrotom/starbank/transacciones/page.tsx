"use client";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table,
  Row,
  Column,
  Cell,
} from "@tanstack/react-table";
import { TransactionsTable, columns } from "./_components/TransactionsTable";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { formatMoney, getActiveAccountBalance } from "../bankUtils";
import { TransactionSkeleton } from "./_components/TransactionSkeleton";
import {
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { StarBankTransaction } from "@boffmedia/shared";
import useStarBank from "../_hooks/useStarBank";

export interface CellDefProps<TData> {
  table: Table<TData>;
  row: Row<TData>;
  column: Column<TData>;
  cell: Cell<TData, unknown>;
  getValue: () => any;
  renderValue: () => any;
}

const PERIODS = [
  { id: "7d",  label: "7 días",  daysBack: 7 },
  { id: "30d", label: "30 días", daysBack: 30 },
  { id: "90d", label: "90 días", daysBack: 90 },
  { id: "all", label: "Todas",   daysBack: 9999 },
] as const;

const TYPES = [
  { id: "all", label: "Todas" },
  { id: "in",  label: "Entradas" },
  { id: "out", label: "Salidas" },
] as const;

type PeriodId = typeof PERIODS[number]["id"];
type TypeId = typeof TYPES[number]["id"];

export default function Transacciones() {
  const { accounts, activeAccount } = useStarBank();
  const [transactions, setTransactions] = useState<StarBankTransaction[]>([]);
  const [period, setPeriod] = useState<PeriodId>("30d");
  const [type, setType] = useState<TypeId>("all");
  const [q, setQ] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  const {
    transactions: fetchedTransactions,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useGetTransactions(activeAccount?.id ?? -1);

  useEffect(() => {
    if (fetchedTransactions) {
      setTransactions(fetchedTransactions);
    }
  }, [fetchedTransactions]);

  const filteredData = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)!.daysBack;
    const cutoff = Date.now() - days * 86400000;
    return transactions
      .filter((t) => new Date(t.date).getTime() >= cutoff)
      .filter(
        (t) =>
          type === "all" ||
          (type === "in" && !t.isPayer) ||
          (type === "out" && t.isPayer),
      )
      .filter(
        (t) =>
          !q ||
          t.reason?.toLowerCase().includes(q.toLowerCase()) ||
          t.toName?.toLowerCase().includes(q.toLowerCase()),
      );
  }, [transactions, period, type, q]);

  const income = useMemo(
    () => filteredData.filter((t) => !t.isPayer).reduce((s, t) => s + t.amount, 0),
    [filteredData],
  );
  const expense = useMemo(
    () => filteredData.filter((t) => t.isPayer).reduce((s, t) => s + t.amount, 0),
    [filteredData],
  );

  const currentBalance = getActiveAccountBalance(accounts ?? [], activeAccount?.id ?? 0);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    meta: { activeAccount },
  });

  if (!accounts || transactionsLoading) return <TransactionSkeleton />;
  if (transactionsError) return <div>Error: {transactionsError}</div>;

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
            Transacciones
          </h1>
          <p style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13.5, marginTop: 4 }}>
            Movimientos de la cuenta {activeAccount?.name?.replace(/_/g, " ") ?? ""}
          </p>
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

      {/* KPI strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <KpiCard
          label="Saldo actual"
          value={formatMoney(currentBalance)}
          icon={<CreditCardIcon style={{ width: 16, height: 16 }} />}
        />
        <KpiCard
          label="Ingresos · periodo"
          value={formatMoney(income)}
          sub={`${filteredData.filter((t) => !t.isPayer).length} entradas`}
          icon={<ArrowUpRightIcon style={{ width: 16, height: 16 }} />}
          tone="pos"
        />
        <KpiCard
          label="Gastos · periodo"
          value={formatMoney(expense)}
          sub={`${filteredData.filter((t) => t.isPayer).length} salidas`}
          icon={<ArrowDownRightIcon style={{ width: 16, height: 16 }} />}
          tone="neg"
        />
      </div>

      {/* Card: filterbar + table + footer */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--sb-border, #e3ebf5)",
          background: "var(--sb-surface, #fff)",
          overflow: "hidden",
          boxShadow: "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))",
        }}
      >
        {/* Filterbar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
          }}
        >
          {/* Period segmented control */}
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
            {PERIODS.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={period === p.id}
                onClick={() => {
                  setPeriod(p.id);
                  table.setPageIndex(0);
                }}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 7,
                  color: period === p.id ? "var(--sb-fg, #0c1830)" : "var(--sb-fg-muted, #5b6b85)",
                  background: period === p.id ? "var(--sb-surface, #fff)" : "transparent",
                  boxShadow:
                    period === p.id ? "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))" : "none",
                  whiteSpace: "nowrap",
                  transition: "all 150ms ease",
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Type segmented control */}
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
            {TYPES.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={type === t.id}
                onClick={() => {
                  setType(t.id);
                  table.setPageIndex(0);
                }}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 7,
                  color: type === t.id ? "var(--sb-fg, #0c1830)" : "var(--sb-fg-muted, #5b6b85)",
                  background: type === t.id ? "var(--sb-surface, #fff)" : "transparent",
                  boxShadow:
                    type === t.id ? "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))" : "none",
                  whiteSpace: "nowrap",
                  transition: "all 150ms ease",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginLeft: "auto", position: "relative", minWidth: 200 }}>
            <MagnifyingGlassIcon
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                color: "var(--sb-fg-subtle, #8d99b3)",
                pointerEvents: "none",
              }}
            />
            <input
              style={{
                height: 32,
                paddingLeft: 30,
                paddingRight: 10,
                fontSize: 13,
                width: "100%",
                borderRadius: 10,
                border: "1px solid var(--sb-border, #e3ebf5)",
                background: "var(--sb-surface-2, #f7faff)",
                color: "var(--sb-fg, #0c1830)",
                outline: "none",
              }}
              placeholder="Buscar…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                table.setPageIndex(0);
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--sb-400, #60a5fa)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
              }}
            />
          </div>
        </div>

        {/* Table */}
        <TransactionsTable table={table} />

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderTop: "1px solid var(--sb-border, #e3ebf5)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--sb-fg-muted, #5b6b85)" }}>
            Mostrando{" "}
            <strong style={{ color: "var(--sb-fg, #0c1830)" }}>{filteredData.length}</strong>{" "}
            transacciones
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                border: "1px solid var(--sb-border, #e3ebf5)",
                background: "var(--sb-surface, #fff)",
                color: "var(--sb-fg, #0c1830)",
                cursor: table.getCanPreviousPage() ? "pointer" : "default",
                opacity: table.getCanPreviousPage() ? 1 : 0.55,
              }}
              onMouseEnter={(e) => {
                if (table.getCanPreviousPage())
                  e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--sb-surface, #fff)";
              }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                border: "1px solid var(--sb-border, #e3ebf5)",
                background: "var(--sb-surface, #fff)",
                color: "var(--sb-fg, #0c1830)",
                cursor: table.getCanNextPage() ? "pointer" : "default",
                opacity: table.getCanNextPage() ? 1 : 0.55,
              }}
              onMouseEnter={(e) => {
                if (table.getCanNextPage())
                  e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--sb-surface, #fff)";
              }}
            >
              Siguiente →
            </button>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              style={{
                height: 32,
                padding: "0 8px",
                borderRadius: 8,
                fontSize: 12.5,
                border: "1px solid var(--sb-border, #e3ebf5)",
                background: "var(--sb-surface-2, #f7faff)",
                color: "var(--sb-fg, #0c1830)",
                cursor: "pointer",
              }}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  Mostrar {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </main>
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
