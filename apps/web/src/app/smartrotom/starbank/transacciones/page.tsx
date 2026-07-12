"use client";
import * as React from "react";
import useStarBank from "../_hooks/useStarBank";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { PageHeader, Card, Kpi, Button, Ico, Seg, Input, Skeleton } from "../_components/ui";
import { TxDetail } from "../_components/TxDetail";
import { CATEGORIES, resolveCategory, type CategoryId } from "../_utils/categories";
import { income, expense, withinDays } from "../_utils/analytics";
import { formatMoney, fmtDate, fmtTime } from "../_utils/format";
import { isOutgoing, displayName, balanceAfter } from "../_utils/account";
import { cn } from "@/lib/utils";
import type { SBTransaction } from "../_types";

const PERIODS = [
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "90d", label: "90 días", days: 90 },
  { id: "all", label: "Todas", days: 9999 },
];
const TYPES = [
  { id: "all", label: "Todas" },
  { id: "in", label: "Entradas" },
  { id: "out", label: "Salidas" },
];
type SortId = "amount" | "balance" | "date";

export default function Transacciones() {
  const { activeAccount } = useStarBank();
  const accId = activeAccount?.id ?? -1;
  const { transactions, isLoading } = useGetTransactions(accId, 100);

  const [period, setPeriod] = React.useState("30d");
  const [type, setType] = React.useState("all");
  const [cat, setCat] = React.useState<"all" | CategoryId>("all");
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ id: SortId; dir: "asc" | "desc" }>({ id: "date", dir: "desc" });
  const [openTx, setOpenTx] = React.useState<SBTransaction | null>(null);

  const all = (transactions ?? []) as SBTransaction[];

  const filtered = React.useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)?.days ?? 30;
    return withinDays(all, days)
      .filter((t) => type === "all" || (type === "in" ? !isOutgoing(t, accId) : isOutgoing(t, accId)))
      .filter((t) => cat === "all" || resolveCategory(t).id === cat)
      .filter((t) => !q || t.reason?.toLowerCase().includes(q.toLowerCase()) || (t.displayName ?? "").toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const dir = sort.dir === "desc" ? -1 : 1;
        if (sort.id === "amount") return ((isOutgoing(a, accId) ? -a.amount : a.amount) - (isOutgoing(b, accId) ? -b.amount : b.amount)) * dir;
        if (sort.id === "balance") return (balanceAfter(a, accId) - balanceAfter(b, accId)) * dir;
        return (+new Date(a.date) - +new Date(b.date)) * dir;
      });
  }, [all, accId, period, type, cat, q, sort]);

  const inc = income(filtered, accId);
  const exp = expense(filtered, accId);

  function toggleSort(id: SortId) {
    setSort((s) => ({ id, dir: s.id === id && s.dir === "desc" ? "asc" : "desc" }));
  }

  function SortHead({ id, label }: { id: SortId; label: string }) {
    const on = sort.id === id;
    return (
      <button type="button" onClick={() => toggleSort(id)} className="inline-flex items-center gap-1.5 hover:text-sb-fg">
        {label}
        <Ico name="sort" size={12} className={on ? "opacity-100" : "opacity-40"} />
      </button>
    );
  }

  if (isLoading || !activeAccount) {
    return (
      <>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-sb-lg" />)}</div>
        <Skeleton className="h-96 rounded-sb-lg" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Transacciones"
        sub={`Movimientos de la cuenta ${displayName(activeAccount.name)}`}
        actions={<Button variant="secondary"><Ico name="download" size={14} /> Exportar</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Saldo actual" value={formatMoney(activeAccount.balance)} icon="card" tone="brand" />
        <Kpi label="Ingresos · periodo" value={formatMoney(inc)} icon="arrUR" tone="pos" sub={`${filtered.filter((t) => !isOutgoing(t, accId)).length} entradas`} />
        <Kpi label="Gastos · periodo" value={formatMoney(exp)} icon="arrDR" tone="neg" sub={`${filtered.filter((t) => isOutgoing(t, accId)).length} salidas`} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-sb-border bg-sb-surface px-4 py-3">
          <Seg options={PERIODS} value={period} onChange={setPeriod} />
          <Seg options={TYPES} value={type} onChange={setType} />
          <FChip active={cat === "all"} onClick={() => setCat("all")}><Ico name="filter" size={12} /> Todas las categorías</FChip>
          {Object.values(CATEGORIES).map((c) => (
            <FChip key={c.id} active={cat === c.id} color={c.hex} onClick={() => setCat(cat === c.id ? "all" : c.id)}>
              <span className="size-1.5 rounded-full" style={{ background: cat === c.id ? "#fff" : c.hex }} />
              {c.label}
            </FChip>
          ))}
          <div className="relative ml-auto min-w-[200px]">
            <Ico name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sb-fg-subtle" />
            <Input className="h-8 pl-8 text-[13px]" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <Th className="w-[280px]">Contraparte</Th>
                <Th>Concepto</Th>
                <Th>Categoría</Th>
                <Th align="right"><SortHead id="amount" label="Cantidad" /></Th>
                <Th align="right"><SortHead id="balance" label="Saldo" /></Th>
                <Th align="right"><SortHead id="date" label="Fecha" /></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sb-fg-muted">No se encontraron transacciones con estos filtros</td></tr>
              ) : (
                filtered.map((tx, i) => {
                  const c = resolveCategory(tx);
                  const out = isOutgoing(tx, accId);
                  return (
                    <tr key={`${tx.date}-${i}`} onClick={() => setOpenTx(tx)} className="cursor-pointer transition-colors hover:bg-sb-surface-2">
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold">{displayName(tx.displayName)}</span>
                        </div>
                        <div className="text-[11px] text-sb-fg-muted">{out ? "Salida" : "Entrada"}</div>
                      </Td>
                      <Td className="text-sb-fg-2">{tx.reason}</Td>
                      <Td>
                        <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-sb-pill px-2.5 text-[11.5px] font-semibold", c.soft, c.text)}>
                          <span className={cn("size-1.5 rounded-full", c.dotBg)} />
                          {c.label}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className={cn("font-semibold tabular-nums", out ? "text-sb-neg" : "text-sb-pos")}>{out ? "− " : "+ "}{formatMoney(tx.amount)}</span>
                      </Td>
                      <Td align="right" className="tabular-nums">{formatMoney(balanceAfter(tx, accId))}</Td>
                      <Td align="right" className="text-sb-fg-muted tabular-nums">
                        <div>{fmtDate(tx.date)}</div>
                        <div className="text-[11px]">{fmtTime(tx.date)}</div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-sb-border p-4">
          <div className="text-[13px] text-sb-fg-muted">
            Mostrando <strong className="text-sb-fg">{filtered.length}</strong> transacciones
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled><Ico name="arrL" size={14} /> Anterior</Button>
            <Button variant="secondary" size="sm">Siguiente <Ico name="arrR" size={14} /></Button>
          </div>
        </div>
      </Card>

      {openTx && <TxDetail tx={openTx} activeAccountId={accId} onClose={() => setOpenTx(null)} />}
    </>
  );
}

function Th({ children, align = "left", className }: { children: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <th className={cn("sticky top-0 border-b border-sb-border bg-sb-surface-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-sb-fg-muted", align === "right" ? "text-right" : "text-left", className)}>
      {children}
    </th>
  );
}
function Td({ children, align = "left", className }: { children: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return <td className={cn("border-b border-sb-border px-4 py-3 text-[13px]", align === "right" ? "text-right" : "text-left", className)}>{children}</td>;
}
function FChip({ children, active, color, onClick }: { children: React.ReactNode; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active && color ? { background: color, borderColor: color, color: "#fff" } : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sb-pill border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        active && !color ? "border-sb-600 bg-sb-600 text-white" : "border-sb-border bg-sb-surface-2 hover:border-sb-border-strong",
      )}
    >
      {children}
    </button>
  );
}
