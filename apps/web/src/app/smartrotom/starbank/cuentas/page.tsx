"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  ArrowsRightLeftIcon,
  ChevronRightIcon,
  UserIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/primitives/dialog";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { Button } from "@/components/ui/primitives/button";
import ImageUpload from "@/components/ui/primitives/image-upload";
import { AccountImage } from "../_components/AccountImage";
import useStarBank from "../_hooks/useStarBank";
import { useBoffSession } from "@/services/useBoffSession";
import { useCreateAccount } from "@/hooks/starbank/useCreateAccount";
import { changeActiveAccount, formatMoney } from "../bankUtils";
import { StarBankAccount } from "@boffmedia/shared";
import Link from "next/link";

const CAT_COLORS = [
  "var(--sb-cat-1, #2463eb)",
  "var(--sb-cat-2, #06b6d4)",
  "var(--sb-cat-3, #8b5cf6)",
  "var(--sb-cat-4, #f59e0b)",
  "var(--sb-cat-5, #10b981)",
  "var(--sb-cat-6, #ec4899)",
];

export default function Cuentas() {
  const { session } = useBoffSession();
  const { accounts, activeAccount, setActiveAccount, fetchAccounts } = useStarBank();
  const [isCreating, setIsCreating] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accountImage, setAccountImage] = useState<File | null>(null);
  const { createAccount } = useCreateAccount();

  const totalBalance = accounts?.reduce((s: number, a: StarBankAccount) => s + a.balance, 0) ?? 0;
  const primary = accounts?.filter((a: StarBankAccount) => a.type === "MAIN") ?? [];
  const secondary = accounts?.filter((a: StarBankAccount) => a.type !== "MAIN") ?? [];
  const secondaryTotal = secondary.reduce((s: number, a: StarBankAccount) => s + a.balance, 0);
  const mainAccount = primary[0] ?? null;

  const handleSelectAccount = (id: number) => {
    setActiveAccount(changeActiveAccount(id));
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error("Por favor, ingresa un nombre para la cuenta");
      return;
    }
    setIsCreating(true);
    try {
      await createAccount(
        { name: newAccountName.trim(), uuid: session?.user.smartRotomUser?.uuid! },
        accountImage ? { image: accountImage } : {}
      );
      setNewAccountName("");
      setAccountImage(null);
      fetchAccounts(session);
      setIsDialogOpen(false);
    } catch {
      toast.error("Error al crear la cuenta");
    } finally {
      setIsCreating(false);
    }
  };

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
            Mis cuentas
          </h1>
          <p style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13.5, margin: "4px 0 0" }}>
            Organiza tu dinero entre tu cuenta principal y tus cuentas secundarias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm transition-colors"
            style={{
              padding: "8px 12px",
              color: "var(--sb-fg-2, #2c3a55)",
              border: "1px solid var(--sb-border, #e3ebf5)",
              background: "var(--sb-surface, #fff)",
            }}
            onClick={() => fetchAccounts(session)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-surface, #fff)"; }}
          >
            <ArrowPathIcon style={{ width: 15, height: 15 }} />
            Actualizar
          </button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm transition-colors"
                style={{
                  padding: "9px 14px",
                  background: "var(--sb-600, #2463eb)",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  boxShadow: "var(--sb-sh-brand, 0 14px 40px -16px rgba(36,99,235,.55))",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-700, #1d4ed8)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-600, #2463eb)"; }}
              >
                <PlusIcon style={{ width: 16, height: 16 }} />
                Nueva cuenta secundaria
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nueva cuenta secundaria</DialogTitle>
                <DialogDescription>
                  Ingresa los datos para crear una nueva cuenta secundaria.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div
                  className="flex items-start gap-2 rounded-[10px] p-3"
                  style={{ background: "var(--sb-info-soft, #e8f0ff)", border: "1px solid var(--sb-100, #dbeafe)" }}
                >
                  <InformationCircleIcon style={{ width: 18, height: 18, color: "var(--sb-600, #2463eb)", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: "var(--sb-info, #1d4ed8)" }}>
                    Las cuentas secundarias te permiten organizar tu dinero para diferentes propósitos como ahorros, gastos diarios, viajes, etc.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-name">Nombre de la cuenta</Label>
                  <Input
                    id="account-name"
                    placeholder="Ej: Ahorros, Gastos, Viaje…"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagen de la cuenta (opcional)</Label>
                  <ImageUpload
                    onImageSelect={(f) => setAccountImage(f)}
                    onImageRemove={() => setAccountImage(null)}
                    value={accountImage}
                    maxSizeInMB={2}
                    placeholder="Sube una imagen personalizada para tu cuenta"
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateAccount}
                  disabled={isCreating || !newAccountName.trim()}
                >
                  {isCreating ? "Creando…" : "Crear cuenta secundaria"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <KpiCard
          label="Balance total"
          value={formatMoney(totalBalance)}
          sub={`Distribuido en ${accounts?.length ?? 0} cuentas`}
          Icon={CreditCardIcon}
          iconBg="var(--sb-surface-2, #f7faff)"
          iconColor="var(--sb-600, #2463eb)"
        />
        <KpiCard
          label="Cuenta principal"
          value={mainAccount?.name ?? "—"}
          sub={formatMoney(mainAccount?.balance ?? 0)}
          Icon={UserIcon}
          iconBg="var(--sb-info-soft, #e8f0ff)"
          iconColor="var(--sb-info, #1d4ed8)"
        />
        <KpiCard
          label="Cuentas secundarias"
          value={`${secondary.length} activas`}
          sub={`Total: ${formatMoney(secondaryTotal)}`}
          Icon={BanknotesIcon}
          iconBg="var(--sb-pos-soft, #e7f7ef)"
          iconColor="var(--sb-pos, #047857)"
        />
      </div>

      {/* ── Main account hero card ── */}
      {mainAccount && (
        <div
          className="relative overflow-hidden rounded-[18px] flex items-center justify-between gap-4 flex-wrap"
          style={{
            background:
              "radial-gradient(500px 250px at 95% 0%, rgba(96,165,250,.25), transparent 70%), linear-gradient(135deg, #1e3a8a, #2463eb)",
            color: "#fff",
            padding: 20,
            border: "1px solid transparent",
            minHeight: 150,
          }}
        >
          {/* Left: avatar + info */}
          <div className="flex items-center gap-4">
            <div
              className="rounded-[12px] overflow-hidden shrink-0"
              style={{ width: 56, height: 56, background: "rgba(255,255,255,.16)" }}
            >
              <AccountImage
                width={56}
                height={56}
                type={mainAccount.type}
                name={mainAccount.name}
                image={(mainAccount as any).image}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#b6d3ff",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Cuenta principal
              </div>
              <div
                style={{
                  fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                  fontSize: 22,
                  fontWeight: 600,
                  marginTop: 4,
                  letterSpacing: "-0.01em",
                }}
              >
                {mainAccount.name}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Link
                  href="/smartrotom/starbank/enviar"
                  className="inline-flex items-center gap-1.5 rounded-[10px] font-semibold text-xs transition-colors"
                  style={{
                    padding: "5px 10px",
                    background: "rgba(255,255,255,.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,.22)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <PaperAirplaneIcon style={{ width: 12, height: 12 }} /> Enviar
                </Link>
                <Link
                  href="/smartrotom/starbank/cuentas"
                  className="inline-flex items-center gap-1.5 rounded-[10px] font-semibold text-xs transition-colors"
                  style={{
                    padding: "5px 10px",
                    background: "#fff",
                    color: "#1e3a8a",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ArrowsRightLeftIcon style={{ width: 12, height: 12 }} /> Mover
                </Link>
              </div>
            </div>
          </div>

          {/* Right: balance + select */}
          <div className="text-right shrink-0">
            <div
              style={{
                fontSize: 11,
                color: "#b6d3ff",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Saldo
            </div>
            <div
              style={{
                fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                marginTop: 2,
              }}
            >
              {formatMoney(mainAccount.balance)}
            </div>
            <button
              className="inline-flex items-center justify-center rounded-[10px] font-semibold text-sm transition-colors mt-2"
              style={{
                padding: "7px 16px",
                background:
                  activeAccount?.id === mainAccount.id
                    ? "#fff"
                    : "rgba(255,255,255,.14)",
                color:
                  activeAccount?.id === mainAccount.id ? "#1e3a8a" : "#fff",
                border: "1px solid rgba(255,255,255,.22)",
                whiteSpace: "nowrap",
              }}
              onClick={() => handleSelectAccount(mainAccount.id)}
            >
              {activeAccount?.id === mainAccount.id ? "Seleccionada" : "Seleccionar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Secondary accounts ── */}
      <div>
        <div
          className="flex items-center justify-between gap-3"
          style={{ marginBottom: 12 }}
        >
          <div>
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
              {secondary.length} activas
            </div>
            <h3
              style={{
                fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                fontSize: 15,
                fontWeight: 600,
                margin: 0,
                color: "var(--sb-fg, #0c1830)",
              }}
            >
              Cuentas secundarias
            </h3>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="inline-flex items-center gap-1.5 rounded-[10px] font-semibold text-xs transition-colors"
                style={{
                  padding: "6px 12px",
                  color: "var(--sb-fg-2, #2c3a55)",
                  border: "1px solid var(--sb-border, #e3ebf5)",
                  background: "var(--sb-surface, #fff)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-surface-2, #f7faff)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-surface, #fff)"; }}
              >
                <PlusIcon style={{ width: 13, height: 13 }} /> Añadir
              </button>
            </DialogTrigger>
          </Dialog>
        </div>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          {secondary.map((acc: StarBankAccount, i: number) => {
            const color = CAT_COLORS[i % CAT_COLORS.length];
            const isActive = activeAccount?.id === acc.id;
            return (
              <button
                key={acc.id}
                className="text-left flex flex-col justify-between transition-all"
                style={{
                  borderRadius: 18,
                  border: `1px solid var(--sb-border, #e3ebf5)`,
                  borderLeft: `4px solid ${color}`,
                  background: "var(--sb-surface, #fff)",
                  padding: 20,
                  minHeight: 180,
                  boxShadow: "var(--sb-sh-1)",
                  transition: "transform 200ms cubic-bezier(.2,.8,.2,1), box-shadow 200ms cubic-bezier(.2,.8,.2,1)",
                }}
                onClick={() => handleSelectAccount(acc.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--sb-sh-2)";
                  e.currentTarget.style.borderColor = "var(--sb-300, #93c5fd)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--sb-sh-1)";
                  e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
                }}
              >
                {/* Top row: avatar + chip */}
                <div className="flex items-start justify-between">
                  <div className="rounded-[12px] overflow-hidden" style={{ width: 44, height: 44 }}>
                    <AccountImage
                      width={44}
                      height={44}
                      type={acc.type}
                      name={acc.name}
                      image={(acc as any).image}
                    />
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full font-semibold"
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      background: color + "1a",
                      color,
                    }}
                  >
                    <span
                      className="rounded-full shrink-0"
                      style={{ width: 5, height: 5, background: color, display: "inline-block" }}
                    />
                    {isActive ? "Activa" : "Secundaria"}
                  </span>
                </div>

                {/* Name + type */}
                <div style={{ marginTop: 14 }}>
                  <div
                    className="font-semibold truncate"
                    style={{ fontSize: 16, color: "var(--sb-fg, #0c1830)" }}
                  >
                    {acc.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)", marginTop: 2 }}>
                    Cuenta secundaria
                  </div>
                </div>

                {/* Balance + arrow */}
                <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                      fontSize: 20,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.01em",
                      color: "var(--sb-fg, #0c1830)",
                    }}
                  >
                    {formatMoney(acc.balance)}
                  </div>
                  <ChevronRightIcon
                    style={{ width: 16, height: 16, color: "var(--sb-fg-muted, #5b6b85)" }}
                  />
                </div>
              </button>
            );
          })}

          {/* Add new card */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="flex flex-col items-center justify-center transition-all"
                style={{
                  borderRadius: 18,
                  border: "2px dashed var(--sb-border-strong, #c9d6ec)",
                  background: "transparent",
                  padding: 20,
                  minHeight: 180,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--sb-600, #2463eb)";
                  e.currentTarget.style.borderColor = "var(--sb-300, #93c5fd)";
                  e.currentTarget.style.background = "var(--sb-50, #eff6ff)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--sb-fg-muted, #5b6b85)";
                  e.currentTarget.style.borderColor = "var(--sb-border-strong, #c9d6ec)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  className="grid place-items-center rounded-[12px]"
                  style={{
                    width: 44,
                    height: 44,
                    background: "var(--sb-surface-3, #eef3fb)",
                    color: "var(--sb-600, #2463eb)",
                    marginBottom: 10,
                  }}
                >
                  <PlusIcon style={{ width: 20, height: 20 }} />
                </div>
                <div className="font-semibold" style={{ fontSize: 14, textAlign: "center" }}>
                  Nueva cuenta secundaria
                </div>
                <div style={{ fontSize: 12, marginTop: 4, textAlign: "center" }}>
                  Ahorros, gastos, viajes…
                </div>
              </button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Empty state */}
        {secondary.length === 0 && (
          <div
            className="flex flex-col items-center justify-center text-center rounded-[18px]"
            style={{
              padding: "48px 24px",
              border: "2px dashed var(--sb-border-strong, #c9d6ec)",
              background: "var(--sb-surface-2, #f7faff)",
              marginTop: 8,
            }}
          >
            <div
              className="grid place-items-center rounded-[12px]"
              style={{
                width: 48,
                height: 48,
                background: "var(--sb-100, #dbeafe)",
                color: "var(--sb-600, #2463eb)",
                marginBottom: 12,
              }}
            >
              <BanknotesIcon style={{ width: 24, height: 24 }} />
            </div>
            <div
              className="font-semibold"
              style={{ fontSize: 16, color: "var(--sb-fg, #0c1830)", marginBottom: 4 }}
            >
              No tienes cuentas secundarias
            </div>
            <p style={{ fontSize: 13, color: "var(--sb-fg-muted, #5b6b85)", maxWidth: 320, margin: "0 0 16px" }}>
              Crea cuentas secundarias para organizar tu dinero según tus necesidades.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 rounded-[14px] font-semibold text-sm transition-colors"
                  style={{
                    padding: "9px 16px",
                    background: "var(--sb-600, #2463eb)",
                    color: "#fff",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-700, #1d4ed8)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-600, #2463eb)"; }}
                >
                  <PlusIcon style={{ width: 16, height: 16 }} />
                  Crear cuenta secundaria
                </button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      className="rounded-[18px]"
      style={{
        background: "var(--sb-surface, #fff)",
        border: "1px solid var(--sb-border, #e3ebf5)",
        boxShadow: "var(--sb-sh-1)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div className="flex items-center justify-between" style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}>
        <span>{label}</span>
        <div className="grid place-items-center rounded-[10px]" style={{ width: 32, height: 32, background: iconBg, color: iconColor }}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--sb-fg, #0c1830)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--sb-fg-muted, #5b6b85)" }}>{sub}</div>
    </div>
  );
}
