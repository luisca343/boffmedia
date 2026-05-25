"use client";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useGetAllAccounts } from "@/hooks/starbank/useGetAllAccounts";
import { useGetAccounts } from "@/hooks/starbank/useGetAccounts";
import { useBoffSession } from "@/services/useBoffSession";
import { useTransfer } from "@/hooks/starbank/useTransfer";
import { AccountImage } from "../_components/AccountImage";
import { formatMoney } from "../bankUtils";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface Account {
  id: number;
  name: string;
  balance: number;
  type: string;
  image?: string;
}

interface DoneSnapshot {
  recipient: Account;
  fromAcc: Account;
  amt: number;
}

const PRESETS = [1000, 5000, 10000, 25000, 50000];

export default function EnviarDinero() {
  const { session } = useBoffSession();
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState<Account | null>(null);
  const [from, setFrom] = useState<number>(-1);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [q, setQ] = useState("");
  const [done, setDone] = useState(false);
  const [doneInfo, setDoneInfo] = useState<DoneSnapshot | null>(null);
  const [error, setError] = useState("");

  const { accounts: allAccounts, isLoading: allLoading, error: allError } = useGetAllAccounts();
  const { accounts: myAccounts, isLoading: myLoading, error: myError } = useGetAccounts(
    session?.user?.smartRotomUser?.uuid ?? "",
  );
  const { transfer, error: transferError, isLoading: isSending } = useTransfer();

  useEffect(() => {
    if (myAccounts && myAccounts.length > 0 && from === -1) {
      setFrom(myAccounts[0].id);
    }
  }, [myAccounts, from]);

  useEffect(() => {
    if (transferError) setError(transferError);
  }, [transferError]);

  const filteredAccounts: Account[] = useMemo(() => {
    const list: Account[] = (allAccounts ?? []).filter((a: Account) => a.id !== from);
    if (!q) return list;
    return list.filter((a: Account) => a.name.toLowerCase().includes(q.toLowerCase()));
  }, [allAccounts, q, from]);

  const fromAcc: Account | undefined = myAccounts?.find((a: Account) => a.id === from);
  const amt = parseFloat(amount.replace(/\./g, "").replace(",", ".")) || 0;
  const canNext1 = !!recipient;
  const canNext2 = amt > 0 && !!fromAcc && amt <= fromAcc.balance;
  const fee = amt > 0 ? 50 : 0;

  function next() { setStep((s) => Math.min(2, s + 1)); }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  async function finish() {
    if (!recipient || !fromAcc) return;
    setError("");
    try {
      await transfer({ from, to: recipient.id, amount: amt, concept: concept || "Transferencia" });
      setDoneInfo({ recipient, fromAcc, amt });
      setDone(true);
    } catch {
      // transferError useEffect handles display
    }
  }

  function resetForm() {
    setStep(0);
    setRecipient(null);
    setAmount("");
    setConcept("");
    setQ("");
    setDone(false);
    setDoneInfo(null);
    setError("");
  }

  if (allLoading || myLoading) {
    return (
      <main
        style={{
          padding: "24px 28px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <p style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 14 }}>Cargando cuentas…</p>
      </main>
    );
  }

  if (allError || myError) {
    return (
      <main style={{ padding: "24px 28px" }}>
        <p style={{ color: "var(--sb-neg-2, #dc2626)" }}>{allError || myError}</p>
      </main>
    );
  }

  // Success state
  if (done && doneInfo) {
    const { recipient: r, fromAcc: fa, amt: a } = doneInfo;
    return (
      <main style={{ padding: "24px 28px" }}>
        <div
          style={{
            padding: 40,
            textAlign: "center",
            width: "100%",
            maxWidth: 460,
            marginInline: "auto",
            marginTop: 40,
            borderRadius: 16,
            border: "1px solid var(--sb-border, #e3ebf5)",
            background: "var(--sb-surface, #fff)",
            boxShadow: "var(--sb-sh-2, 0 4px 16px -4px rgba(15,30,60,.12))",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 999,
              background: "var(--sb-pos-soft, rgba(5,150,105,.1))",
              color: "var(--sb-pos-2, #059669)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
            }}
          >
            <CheckIcon style={{ width: 36, height: 36 }} />
          </div>
          <h2
            style={{
              fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
              fontSize: 24,
              fontWeight: 600,
              margin: "0 0 6px",
              color: "var(--sb-fg, #0c1830)",
            }}
          >
            ¡Transferencia enviada!
          </h2>
          <p style={{ color: "var(--sb-fg-muted, #5b6b85)", marginBottom: 18, fontSize: 14 }}>
            Has enviado{" "}
            <strong style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(a)}</strong> a{" "}
            <strong>{r.name.replace(/_/g, " ")}</strong>
          </p>
          <div
            style={{
              fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
              fontSize: 48,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: "var(--sb-fg, #0c1830)",
              marginBottom: 18,
            }}
          >
            {formatMoney(a)}
          </div>
          <div
            style={{
              background: "var(--sb-surface-2, #f7faff)",
              padding: 14,
              borderRadius: 10,
              textAlign: "left",
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--sb-fg-muted, #5b6b85)" }}>De</span>
              <span style={{ color: "var(--sb-fg, #0c1830)" }}>{fa.name.replace(/_/g, " ")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--sb-fg-muted, #5b6b85)" }}>Concepto</span>
              <span style={{ color: "var(--sb-fg, #0c1830)" }}>{concept || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--sb-fg-muted, #5b6b85)" }}>Referencia</span>
              <span style={{ fontFamily: "ui-monospace", color: "var(--sb-fg, #0c1830)" }}>
                SR-{Date.now().toString().slice(-8)}
              </span>
            </div>
          </div>
          <button
            style={{
              marginTop: 20,
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              background: "var(--sb-600, #2463eb)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            onClick={resetForm}
          >
            Nueva transferencia
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
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
          Enviar dinero
        </h1>
        <p style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13.5, marginTop: 4 }}>
          Transfiere a otro entrenador, tienda o cuenta tuya
        </p>
      </div>

      {/* Wizard card */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--sb-border, #e3ebf5)",
          background: "var(--sb-surface, #fff)",
          padding: 24,
          boxShadow: "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))",
        }}
      >
        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 28px" }}>
          <StepItem n={1} label="Destinatario" active={step === 0} done={step > 0} />
          <div
            style={{
              flex: 1,
              height: 2,
              background: step > 0 ? "var(--sb-300, #93c5fd)" : "var(--sb-border, #e3ebf5)",
              borderRadius: 999,
              transition: "background 300ms ease",
            }}
          />
          <StepItem n={2} label="Importe" active={step === 1} done={step > 1} />
          <div
            style={{
              flex: 1,
              height: 2,
              background: step > 1 ? "var(--sb-300, #93c5fd)" : "var(--sb-border, #e3ebf5)",
              borderRadius: 999,
              transition: "background 300ms ease",
            }}
          />
          <StepItem n={3} label="Revisar" active={step === 2} done={false} />
        </div>

        {/* Step 0: Destinatario */}
        {step === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              width: "100%",
              maxWidth: 720,
              marginInline: "auto",
            }}
          >
            <div>
              <label
                htmlFor="recip-search"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Buscar destinatario
              </label>
              <div style={{ position: "relative" }}>
                <MagnifyingGlassIcon
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "var(--sb-fg-subtle, #8d99b3)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="recip-search"
                  style={{
                    width: "100%",
                    height: 42,
                    paddingLeft: 38,
                    paddingRight: 14,
                    borderRadius: 12,
                    border: "1px solid var(--sb-border, #e3ebf5)",
                    background: "var(--sb-surface-2, #f7faff)",
                    color: "var(--sb-fg, #0c1830)",
                    fontSize: 14,
                    outline: "none",
                  }}
                  placeholder="Nombre de cuenta…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--sb-400, #60a5fa)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
                  }}
                />
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Cuentas disponibles
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 10,
                }}
              >
                {filteredAccounts.slice(0, 12).map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    selected={recipient?.id === acc.id}
                    onClick={() => setRecipient(acc)}
                  />
                ))}
                {filteredAccounts.length === 0 && (
                  <p
                    style={{
                      color: "var(--sb-fg-muted, #5b6b85)",
                      fontSize: 13,
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: 20,
                    }}
                  >
                    No se encontraron cuentas
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <GhostButton>Cancelar</GhostButton>
              <PrimaryButton disabled={!canNext1} onClick={next}>
                Continuar <ArrowRightIcon style={{ width: 14, height: 14 }} />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Step 1: Importe */}
        {step === 1 && fromAcc && recipient && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              width: "100%",
              maxWidth: 520,
              marginInline: "auto",
            }}
          >
            {/* Recipient banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                padding: 14,
                background: "var(--sb-surface-2, #f7faff)",
                borderRadius: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "var(--sb-fg-muted, #5b6b85)", fontSize: 13 }}>Enviando a</span>
              <div
                style={{
                  borderRadius: "50%",
                  overflow: "hidden",
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                }}
              >
                <AccountImage
                  width={28}
                  height={28}
                  type={recipient.type}
                  name={recipient.name}
                  image={(recipient as any).image}
                />
              </div>
              <strong style={{ color: "var(--sb-fg, #0c1830)", fontSize: 13 }}>
                {recipient.name.replace(/_/g, " ")}
              </strong>
              <button
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sb-600, #2463eb)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setStep(0)}
              >
                Cambiar
              </button>
            </div>

            {/* Amount input */}
            <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Importe
              </p>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                style={{
                  textAlign: "center",
                  fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                  fontSize: 56,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  border: 0,
                  background: "transparent",
                  width: "100%",
                  outline: "none",
                  color: "var(--sb-fg, #0c1830)",
                  fontVariantNumeric: "tabular-nums",
                  caretColor: "var(--sb-600, #2463eb)",
                }}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              />
              <p
                style={{
                  fontSize: 13,
                  color:
                    amt > fromAcc.balance
                      ? "var(--sb-neg-2, #dc2626)"
                      : "var(--sb-fg-muted, #5b6b85)",
                }}
              >
                {amt > fromAcc.balance
                  ? `Excede el saldo disponible (${formatMoney(fromAcc.balance)})`
                  : `Disponible en ${fromAcc.name.replace(/_/g, " ")}: ${formatMoney(fromAcc.balance)}`}
              </p>
            </div>

            {/* Presets */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {PRESETS.map((v) => (
                <PresetButton
                  key={v}
                  onClick={() => setAmount(v.toLocaleString("es-ES"))}
                >
                  {formatMoney(v)}
                </PresetButton>
              ))}
            </div>

            {/* From account */}
            <div>
              <label
                htmlFor="from-acc"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Pagar desde
              </label>
              <select
                id="from-acc"
                value={from}
                onChange={(e) => setFrom(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  height: 42,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: "1px solid var(--sb-border, #e3ebf5)",
                  background: "var(--sb-surface-2, #f7faff)",
                  color: "var(--sb-fg, #0c1830)",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {myAccounts?.map((a: Account) => (
                  <option key={a.id} value={a.id}>
                    {a.name.replace(/_/g, " ")} — {formatMoney(a.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Concept */}
            <div>
              <label
                htmlFor="concept"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Concepto (opcional)
              </label>
              <input
                id="concept"
                style={{
                  width: "100%",
                  height: 42,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: "1px solid var(--sb-border, #e3ebf5)",
                  background: "var(--sb-surface-2, #f7faff)",
                  color: "var(--sb-fg, #0c1830)",
                  fontSize: 14,
                  outline: "none",
                }}
                placeholder="Ej: Reembolso pokébolas"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                maxLength={60}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--sb-400, #60a5fa)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <GhostButton onClick={prev}>
                <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Atrás
              </GhostButton>
              <PrimaryButton disabled={!canNext2} onClick={next}>
                Revisar <ArrowRightIcon style={{ width: 14, height: 14 }} />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Step 2: Revisar */}
        {step === 2 && fromAcc && recipient && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              width: "100%",
              maxWidth: 520,
              marginInline: "auto",
            }}
          >
            {/* Big amount */}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sb-fg-muted, #5b6b85)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Vas a enviar
              </p>
              <div
                style={{
                  fontFamily: "var(--sb-font-display, 'Space Grotesk', sans-serif)",
                  fontSize: 56,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--sb-fg, #0c1830)",
                }}
              >
                {formatMoney(amt)}
              </div>
            </div>

            {/* Summary card */}
            <div
              style={{
                background: "var(--sb-surface-2, #f7faff)",
                padding: 18,
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SummaryRow label="De">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ borderRadius: "50%", overflow: "hidden", width: 24, height: 24 }}>
                    <AccountImage
                      width={24}
                      height={24}
                      type={fromAcc.type}
                      name={fromAcc.name}
                      image={(fromAcc as any).image}
                    />
                  </div>
                  <strong style={{ fontSize: 13, color: "var(--sb-fg, #0c1830)" }}>
                    {fromAcc.name.replace(/_/g, " ")}
                  </strong>
                </div>
              </SummaryRow>
              <Divider />
              <SummaryRow label="A">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ borderRadius: "50%", overflow: "hidden", width: 24, height: 24 }}>
                    <AccountImage
                      width={24}
                      height={24}
                      type={recipient.type}
                      name={recipient.name}
                      image={(recipient as any).image}
                    />
                  </div>
                  <strong style={{ fontSize: 13, color: "var(--sb-fg, #0c1830)" }}>
                    {recipient.name.replace(/_/g, " ")}
                  </strong>
                </div>
              </SummaryRow>
              <Divider />
              <SummaryRow label="Concepto">
                <span style={{ fontSize: 13, color: "var(--sb-fg, #0c1830)" }}>
                  {concept || "—"}
                </span>
              </SummaryRow>
              <SummaryRow label="Comisión">
                <span
                  style={{
                    fontSize: 13,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--sb-fg, #0c1830)",
                  }}
                >
                  {formatMoney(fee)}
                </span>
              </SummaryRow>
              <Divider />
              <SummaryRow label="Total a debitar" bold>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--sb-fg, #0c1830)",
                  }}
                >
                  {formatMoney(amt + fee)}
                </span>
              </SummaryRow>
            </div>

            {/* Info banner */}
            <div
              style={{
                display: "flex",
                gap: 10,
                background: "var(--sb-info-soft, rgba(29,78,216,.1))",
                padding: 12,
                borderRadius: 10,
                color: "var(--sb-info, #1d4ed8)",
                alignItems: "flex-start",
              }}
            >
              <ShieldCheckIcon style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12.5 }}>
                Transferencia instantánea y protegida por 2FA. Saldo proyectado tras la operación:{" "}
                <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatMoney(fromAcc.balance - amt - fee)}
                </strong>
              </span>
            </div>

            {error && (
              <p style={{ color: "var(--sb-neg-2, #dc2626)", fontSize: 13, margin: 0 }}>{error}</p>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <GhostButton onClick={prev} disabled={isSending}>
                <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Atrás
              </GhostButton>
              <PrimaryButton onClick={finish} disabled={isSending} large>
                {isSending ? (
                  "Procesando…"
                ) : (
                  <>
                    <PaperAirplaneIcon style={{ width: 16, height: 16 }} /> Confirmar y enviar
                  </>
                )}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function StepItem({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: active ? "var(--sb-fg, #0c1830)" : "var(--sb-fg-muted, #5b6b85)",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: done
            ? "var(--sb-pos-2, #059669)"
            : active
              ? "var(--sb-600, #2463eb)"
              : "var(--sb-surface-3, #eef3fb)",
          color: done || active ? "#fff" : "var(--sb-fg-muted, #5b6b85)",
          fontWeight: 600,
          fontSize: 13,
          transition: "all 250ms ease",
          flexShrink: 0,
        }}
      >
        {done ? <CheckIcon style={{ width: 14, height: 14 }} /> : n}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

function AccountCard({
  account,
  selected,
  onClick,
}: {
  account: Account;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 8px",
        borderRadius: 12,
        border: selected
          ? "1px solid var(--sb-600, #2463eb)"
          : "1px solid var(--sb-border, #e3ebf5)",
        background: selected ? "var(--sb-50, #eff6ff)" : "var(--sb-surface, #fff)",
        boxShadow: selected ? "var(--sb-sh-1, 0 1px 4px rgba(15,30,60,.06))" : "none",
        cursor: "pointer",
        gap: 8,
        transition: "all 150ms ease",
        textAlign: "center",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "var(--sb-300, #93c5fd)";
          e.currentTarget.style.background = "var(--sb-50, #eff6ff)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
          e.currentTarget.style.background = "var(--sb-surface, #fff)";
        }
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          overflow: "hidden",
          background: "var(--sb-surface-3, #eef3fb)",
        }}
      >
        <AccountImage
          width={44}
          height={44}
          type={account.type}
          name={account.name}
          image={(account as any).image}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sb-fg, #0c1830)" }}>
        {account.name.replace(/_/g, " ")}
      </span>
      <span style={{ fontSize: 11, color: "var(--sb-fg-muted, #5b6b85)" }}>
        {formatMoney(account.balance)}
      </span>
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 38,
        padding: "0 16px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 500,
        color: "var(--sb-600, #2463eb)",
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--sb-50, #eff6ff)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  large,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: large ? 44 : 38,
        padding: large ? "0 20px" : "0 16px",
        borderRadius: 10,
        fontSize: large ? 14.5 : 13.5,
        fontWeight: 500,
        background: "var(--sb-600, #2463eb)",
        color: "#fff",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
        boxShadow: "0 2px 8px -2px rgba(36,99,235,.4)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--sb-700, #1d4ed8)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--sb-600, #2463eb)";
      }}
    >
      {children}
    </button>
  );
}

function PresetButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid var(--sb-border, #e3ebf5)",
        background: "var(--sb-surface, #fff)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        color: "var(--sb-fg-2, #2c3a55)",
        transition: "all 150ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--sb-50, #eff6ff)";
        e.currentTarget.style.borderColor = "var(--sb-300, #93c5fd)";
        e.currentTarget.style.color = "var(--sb-700, #1d4ed8)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--sb-surface, #fff)";
        e.currentTarget.style.borderColor = "var(--sb-border, #e3ebf5)";
        e.currentTarget.style.color = "var(--sb-fg-2, #2c3a55)";
      }}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  children,
  bold,
}: {
  label: string;
  children: ReactNode;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
      }}
    >
      <span
        style={{
          color: bold ? "var(--sb-fg, #0c1830)" : "var(--sb-fg-muted, #5b6b85)",
          fontSize: 13,
          fontWeight: bold ? 600 : 400,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ height: 1, background: "var(--sb-border, #e3ebf5)" }} />
  );
}
