"use client";
import { useState } from "react";
import Link from "next/link";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  CreditCardIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import useStarBank from "./_hooks/useStarBank";
import { useBoffSession } from "@/services/useBoffSession";
import { useGetTransactions } from "@/hooks/starbank/useGetTransactions";
import { AccountImage } from "./_components/AccountImage";
import { formatMoney, changeActiveAccount } from "./bankUtils";
import { DashboardSkeleton } from "./_components/DashBoardSkeleton";
import { StarBankTransaction, StarBankAccount } from "@boffmedia/shared";
import { strToDate } from "@/lib/utils";

export default function StarBank() {
  const { session } = useBoffSession();
  const { accounts, activeAccount, setActiveAccount } = useStarBank();
  const { transactions, isLoading: transactionsLoading } = useGetTransactions(
    activeAccount?.id ?? -1,
    100
  );
  const [hideBal, setHideBal] = useState(false);

  function getChartData() {
    return (
      transactions
        ?.slice()
        .reverse()
        .reduce(
          (acc: { name: string; balance: number }[], tx: StarBankTransaction) => {
            const bal = tx.isPayer ? tx.fromBalance : tx.toBalance;
            if (bal != null) acc.push({ name: strToDate(tx.date), balance: bal });
            return acc;
          },
          []
        ) ?? []
    );
  }

  const chartData = getChartData();
  const currentBalance = activeAccount?.balance ?? 0;
  const weekStart =
    chartData.length >= 8
      ? chartData[chartData.length - 8].balance
      : chartData[0]?.balance ?? currentBalance;
  const weekDelta =
    weekStart > 0 ? ((currentBalance - weekStart) / weekStart) * 100 : 0;
  const weekAbsDiff = currentBalance - weekStart;

  const incomeMonth =
    transactions
      ?.filter((t: StarBankTransaction) => !t.isPayer)
      .reduce((s: number, t: StarBankTransaction) => s + t.amount, 0) ?? 0;
  const expenseMonth =
    transactions
      ?.filter((t: StarBankTransaction) => t.isPayer)
      .reduce((s: number, t: StarBankTransaction) => s + t.amount, 0) ?? 0;
  const savingsRate =
    incomeMonth > 0
      ? ((incomeMonth - expenseMonth) / incomeMonth) * 100
      : 0;

  const recent: StarBankTransaction[] = transactions?.slice(0, 6) ?? [];
  const firstName =
    session?.user?.name?.split(" ")[0] ?? activeAccount?.name ?? "Usuario";
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!accounts || transactionsLoading) return <DashboardSkeleton />;

  return (
    <div
      style={{
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 1480,
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            style={{
              fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
              fontWeight: 600,
              fontSize: 28,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--sb-fg, #0c1830)",
            }}
          >
            Hola, {firstName}
          </h1>
          <p
            style={{
              color: "var(--sb-fg-muted, #5b6b85)",
              fontSize: 13.5,
              marginTop: 4,
              margin: "4px 0 0",
            }}
          >
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </p>
        </div>
        <Link
          href="/smartrotom/starbank/enviar"
          className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm transition-colors"
          style={{
            padding: "9px 14px",
            background: "var(--sb-600, #2463eb)",
            color: "#fff",
            boxShadow: "var(--sb-sh-brand, 0 14px 40px -16px rgba(36,99,235,.55))",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--sb-700, #1d4ed8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--sb-600, #2463eb)";
          }}
        >
          <PaperAirplaneIcon style={{ width: 16, height: 16 }} />
          Enviar
        </Link>
      </div>

      {/* ── Hero balance card ── */}
      <div
        className="relative overflow-hidden rounded-[24px]"
        style={{
          background:
            "radial-gradient(600px 280px at 100% 0%, rgba(96,165,250,.35), transparent 70%), radial-gradient(800px 400px at -10% 110%, rgba(36,99,235,.5), transparent 60%), linear-gradient(135deg, #0b1638, #1e3a8a 55%, #2463eb)",
          color: "#fff",
          padding: 28,
          boxShadow:
            "var(--sb-sh-brand, 0 14px 40px -16px rgba(36,99,235,.55))",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 28,
          alignItems: "stretch",
        }}
      >
        {/* grid mesh */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.35,
            backgroundImage:
              "linear-gradient(transparent 95%, rgba(255,255,255,.18) 95%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,.12) 95%)",
            backgroundSize: "28px 28px",
            WebkitMaskImage:
              "radial-gradient(ellipse at 20% 30%, black 0%, transparent 70%)",
            maskImage:
              "radial-gradient(ellipse at 20% 30%, black 0%, transparent 70%)",
          }}
        />

        {/* Left */}
        <div className="relative flex flex-col gap-3.5">
          {/* Account pill */}
          <div
            className="self-start inline-flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.18)",
              padding: "5px 11px 5px 5px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="rounded-full overflow-hidden block shrink-0"
              style={{ width: 22, height: 22 }}
            >
              <AccountImage
                width={22}
                height={22}
                type={activeAccount?.type}
                name={activeAccount?.name}
                image={(activeAccount as any)?.image}
              />
            </span>
            Cuenta principal · {activeAccount?.name ?? ""}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#c8d4ec",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            Balance disponible
          </div>

          {/* Balance amount */}
          <div
            className="inline-flex items-baseline gap-1.5"
            style={{
              fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
              fontSize: "clamp(40px, 6vw, 64px)",
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {hideBal
              ? "•••••••"
              : new Intl.NumberFormat("es-ES").format(currentBalance)}
            <span style={{ fontSize: "0.42em", color: "#93c5fd", fontWeight: 600 }}>
              ¥
            </span>
            <button
              onClick={() => setHideBal((h) => !h)}
              aria-label={hideBal ? "Mostrar saldo" : "Ocultar saldo"}
              style={{ marginLeft: 8, opacity: 0.6, color: "#fff", padding: 4 }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
            >
              {hideBal ? (
                <EyeIcon style={{ width: 20, height: 20 }} />
              ) : (
                <EyeSlashIcon style={{ width: 20, height: 20 }} />
              )}
            </button>
          </div>

          {/* Delta */}
          <div
            className="inline-flex gap-1.5 items-center"
            style={{ fontSize: 13, color: "#b6d3ff" }}
          >
            <span
              style={{
                color: weekDelta >= 0 ? "#6ee7b7" : "#fca5a5",
                fontWeight: 600,
              }}
            >
              {weekDelta >= 0 ? "▲" : "▼"} {formatMoney(Math.abs(weekAbsDiff))} (
              {weekDelta.toFixed(1)}%)
            </span>
            <span style={{ color: "#9bb3da" }}>en los últimos 7 días</span>
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap gap-2" style={{ marginTop: 6 }}>
            <Link
              href="/smartrotom/starbank/enviar"
              className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm px-3.5 py-2 transition-colors"
              style={{
                backdropFilter: "blur(8px)",
                background: "#fff",
                color: "#172554",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <PaperAirplaneIcon style={{ width: 14, height: 14, flexShrink: 0 }} /> Enviar
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm px-3.5 py-2 transition-colors"
              style={{
                backdropFilter: "blur(8px)",
                background: "rgba(255,255,255,.13)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.22)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <QrCodeIcon style={{ width: 14, height: 14, flexShrink: 0 }} /> Solicitar
            </button>
            <Link
              href="/smartrotom/starbank/cuentas"
              className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm px-3.5 py-2 transition-colors"
              style={{
                backdropFilter: "blur(8px)",
                background: "rgba(255,255,255,.13)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.22)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <ArrowsRightLeftIcon style={{ width: 14, height: 14, flexShrink: 0 }} /> Mover entre cuentas
            </Link>
            <Link
              href="/smartrotom/starbank/graficas"
              className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm px-3.5 py-2 transition-colors"
              style={{
                backdropFilter: "blur(8px)",
                background: "rgba(255,255,255,.13)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.22)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <ChartBarIcon style={{ width: 14, height: 14, flexShrink: 0 }} /> Insights
            </Link>
          </div>
        </div>

        {/* Right: sparkline */}
        <div className="relative" style={{ minHeight: 180 }}>
          <div
            className="absolute inset-0 flex flex-col"
            style={{ padding: "0 8px 8px" }}
          >
            <div
              className="flex justify-between"
              style={{ color: "#9bb3da", fontSize: 11, marginBottom: 6 }}
            >
              <span>Hace 30 días</span>
              <span>Hoy</span>
            </div>
            <div className="flex-1" style={{ borderRadius: 12, overflow: "hidden" }}>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="sbSparkGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#93c5fd"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#93c5fd"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#93c5fd"
                      strokeWidth={2.5}
                      fill="url(#sbSparkGrad)"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="h-full flex items-center justify-center"
                  style={{ color: "#9bb3da", fontSize: 12 }}
                >
                  Sin datos de historial
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        <KpiCard
          label="Ingresos del mes"
          value={formatMoney(incomeMonth)}
          icon="up"
          tone="pos"
          delta={null}
          sub="Entradas totales"
        />
        <KpiCard
          label="Gastos del mes"
          value={formatMoney(expenseMonth)}
          icon="dn"
          tone="neg"
          delta={null}
          sub="Salidas totales"
        />
        <KpiCard
          label="Tasa de ahorro"
          value={savingsRate.toFixed(0) + " %"}
          icon="shield"
          tone={null}
          delta={null}
          sub={`Has guardado ${formatMoney(Math.max(0, incomeMonth - expenseMonth))}`}
        />
      </div>

      {/* ── Quick actions + Accounts ── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
      >
        {/* Quick actions */}
        <div
          className="rounded-[18px] overflow-hidden flex flex-col"
          style={{
            gridColumn: "span 8",
            background: "var(--sb-surface, #fff)",
            border: "1px solid var(--sb-border, #e3ebf5)",
            boxShadow: "var(--sb-sh-1)",
          }}
        >
          <SectionHead title="Acciones rápidas" eyebrow="Atajos" />
          <div style={{ padding: "14px 20px 20px", flex: 1 }}>
            <div
              className="grid gap-2.5"
              style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
              <QuickAction
                icon={<PaperAirplaneIcon style={{ width: 18, height: 18 }} />}
                title="Enviar dinero"
                sub="A un entrenador o tienda"
                href="/smartrotom/starbank/enviar"
              />
              <QuickAction
                icon={<CreditCardIcon style={{ width: 18, height: 18 }} />}
                title="Mover entre cuentas"
                sub="Reorganiza tu dinero"
                href="/smartrotom/starbank/cuentas"
              />
              <QuickAction
                icon={<QrCodeIcon style={{ width: 18, height: 18 }} />}
                title="Solicitar pago"
                sub="Comparte tu código"
              />
              <QuickAction
                icon={<CalendarIcon style={{ width: 18, height: 18 }} />}
                title="Programar pago"
                sub="Pagos recurrentes"
                href="/smartrotom/starbank/calendario"
              />
            </div>
          </div>
        </div>

        {/* Accounts overview */}
        <div
          className="rounded-[18px] overflow-hidden flex flex-col"
          style={{
            gridColumn: "span 4",
            background: "var(--sb-surface, #fff)",
            border: "1px solid var(--sb-border, #e3ebf5)",
            boxShadow: "var(--sb-sh-1)",
          }}
        >
          <SectionHead
            title="Tus cuentas"
            eyebrow={`${accounts.length} cuenta${accounts.length !== 1 ? "s" : ""}`}
            action={
              <Link
                href="/smartrotom/starbank/cuentas"
                className="inline-flex items-center font-semibold rounded-[10px] transition-colors"
                style={{
                  fontSize: 12.5,
                  padding: "5px 10px",
                  color: "var(--sb-600, #2463eb)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--sb-50, #eff6ff)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Gestionar
              </Link>
            }
          />
          <div style={{ padding: 0 }}>
            {accounts.map((acc: StarBankAccount) => (
              <Link
                key={acc.id}
                href="/smartrotom/starbank/cuentas"
                className="flex items-center gap-3 transition-colors"
                style={{
                  padding: "10px 20px",
                  borderTop: "1px solid var(--sb-border, #e3ebf5)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  className="shrink-0 rounded-full overflow-hidden"
                  style={{ width: 36, height: 36 }}
                >
                  <AccountImage
                    width={36}
                    height={36}
                    type={acc.type}
                    name={acc.name}
                    image={(acc as any).image}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold truncate"
                    style={{ fontSize: 13.5, color: "var(--sb-fg, #0c1830)" }}
                  >
                    {acc.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--sb-fg-muted, #5b6b85)",
                    }}
                  >
                    {acc.type === "MAIN" ? "Cuenta principal" : "Cuenta secundaria"}
                  </div>
                </div>
                <div
                  className="tabular-nums font-semibold shrink-0"
                  style={{ fontSize: 13.5, color: "var(--sb-fg, #0c1830)" }}
                >
                  {formatMoney(acc.balance)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div
        className="rounded-[18px] overflow-hidden flex flex-col"
        style={{
          background: "var(--sb-surface, #fff)",
          border: "1px solid var(--sb-border, #e3ebf5)",
          boxShadow: "var(--sb-sh-1)",
        }}
      >
        <SectionHead
          title="Transacciones recientes"
          eyebrow="Últimos movimientos"
          action={
            <Link
              href="/smartrotom/starbank/transacciones"
              className="inline-flex items-center font-semibold rounded-[10px] transition-colors"
              style={{
                fontSize: 12.5,
                padding: "5px 10px",
                color: "var(--sb-600, #2463eb)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--sb-50, #eff6ff)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Ver todas
            </Link>
          }
        />
        {recent.length === 0 ? (
          <div
            style={{
              padding: "24px 20px",
              textAlign: "center",
              color: "var(--sb-fg-muted, #5b6b85)",
              fontSize: 13,
            }}
          >
            No hay transacciones recientes
          </div>
        ) : (
          recent.map((tx: StarBankTransaction, i) => (
            <TxRow key={`${tx.date}-${i}`} tx={tx} isLast={i === recent.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function KpiCard({
  label,
  value,
  icon,
  tone,
  delta,
  sub,
}: {
  label: string;
  value: string;
  icon: "up" | "dn" | "shield";
  tone: "pos" | "neg" | null;
  delta: number | null;
  sub: string;
}) {
  const iconBg =
    tone === "pos"
      ? "var(--sb-pos-soft, #e7f7ef)"
      : tone === "neg"
      ? "var(--sb-neg-soft, #fdecec)"
      : "var(--sb-surface-2, #f7faff)";
  const iconColor =
    tone === "pos"
      ? "var(--sb-pos, #047857)"
      : tone === "neg"
      ? "var(--sb-neg, #b91c1c)"
      : "var(--sb-600, #2463eb)";
  const IconComp =
    icon === "up"
      ? ArrowTrendingUpIcon
      : icon === "dn"
      ? ArrowTrendingDownIcon
      : ShieldCheckIcon;

  return (
    <div
      className="rounded-[18px]"
      style={{
        background: "var(--sb-surface, #fff)",
        border: "1px solid var(--sb-border, #e3ebf5)",
        boxShadow: "var(--sb-sh-1)",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: 6, padding: "18px 20px" }}
      >
        <div
          className="flex items-center justify-between"
          style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}
        >
          <span>{label}</span>
          <div
            className="grid place-items-center rounded-[10px]"
            style={{ width: 32, height: 32, background: iconBg, color: iconColor }}
          >
            <IconComp style={{ width: 16, height: 16 }} />
          </div>
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
        <div
          className="flex items-center gap-1.5"
          style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}
        >
          {delta != null && (
            <span
              style={{
                color:
                  delta >= 0
                    ? "var(--sb-pos, #047857)"
                    : "var(--sb-neg, #b91c1c)",
                fontWeight: 600,
              }}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          <span>{sub}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHead({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3"
      style={{ padding: "18px 20px 6px" }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--sb-fg-muted, #5b6b85)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 2,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h3
          className="truncate"
          style={{
            fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            margin: 0,
            color: "var(--sb-fg, #0c1830)",
          }}
        >
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

function QuickAction({
  icon,
  title,
  sub,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  href?: string;
}) {
  const content = (
    <>
      <div
        className="shrink-0 grid place-items-center rounded-[10px] transition-colors"
        style={{
          width: 38,
          height: 38,
          background: "var(--sb-surface-3, #eef3fb)",
          color: "var(--sb-600, #2463eb)",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          className="font-semibold"
          style={{ fontSize: 13.5, color: "var(--sb-fg, #0c1830)" }}
        >
          {title}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--sb-fg-muted, #5b6b85)" }}>
          {sub}
        </div>
      </div>
    </>
  );

  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    border: "1px solid var(--sb-border, #e3ebf5)",
    borderRadius: 14,
    background: "var(--sb-surface, #fff)",
    transition: "all 200ms cubic-bezier(.2,.8,.2,1)",
    textAlign: "left",
    width: "100%",
  };

  function handleEnter(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.borderColor = "var(--sb-300, #93c5fd)";
    e.currentTarget.style.background = "var(--sb-50, #eff6ff)";
    e.currentTarget.style.boxShadow = "var(--sb-sh-2)";
  }
  function handleLeave(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
    e.currentTarget.style.background = "var(--sb-surface, #fff)";
    e.currentTarget.style.boxShadow = "none";
  }

  if (href) {
    return (
      <Link
        href={href}
        style={baseStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      style={baseStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {content}
    </button>
  );
}

function TxRow({
  tx,
  isLast,
}: {
  tx: StarBankTransaction;
  isLast: boolean;
}) {
  const isIncoming = !tx.isPayer;
  return (
    <div
      className="grid items-center gap-3 cursor-pointer transition-colors"
      style={{
        gridTemplateColumns: "36px 1fr auto auto",
        padding: "14px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--sb-border, #e3ebf5)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        className="rounded-full overflow-hidden shrink-0"
        style={{ width: 36, height: 36 }}
      >
        <AccountImage
          width={36}
          height={36}
          type={tx.displayAccountType}
          name={tx.displayName}
          image={(tx as any).displayImage}
        />
      </div>
      <div className="min-w-0">
        <div
          className="font-semibold truncate"
          style={{ fontSize: 13.5, color: "var(--sb-fg, #0c1830)" }}
        >
          {tx.reason || tx.displayName}
        </div>
        <div
          className="flex items-center gap-2"
          style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}
        >
          <span>{tx.displayName}</span>
        </div>
      </div>
      <div
        className="tabular-nums font-semibold"
        style={{
          fontSize: 14,
          textAlign: "right",
          color: isIncoming
            ? "var(--sb-pos, #047857)"
            : "var(--sb-neg, #b91c1c)",
        }}
      >
        {isIncoming ? "+ " : "− "}
        {formatMoney(tx.amount)}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--sb-fg-muted, #5b6b85)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {strToDate(tx.date)}
      </div>
    </div>
  );
}
