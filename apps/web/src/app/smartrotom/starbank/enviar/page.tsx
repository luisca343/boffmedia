"use client";
import * as React from "react";
import type { CreateTransferDto } from "@boffmedia/shared";
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid";
import { useAccounts, useAllAccounts, useTransferMutation } from "../_hooks/queries";
import { userMessageFrom } from "@/services/boffAPI";
import { PageHeader, Card, Button, Ico, Stepper, Label, Input, Select, ContactAvatar, AccountAvatar } from "../_components/ui";
import { formatMoney, parseAmount } from "../_utils/format";
import { displayName, transferBlocker } from "../_utils/account";
import { cn } from "@/lib/utils";
import type { SBAccount } from "../_types";

const BASE = "/smartrotom/starbank";
const PRESETS = [1000, 5000, 10000, 25000, 50000];
const STEPS = ["Destinatario", "Importe", "Revisar"];

export default function Enviar() {
  const uuid = useRotomUuid();
  const { data: myAccounts } = useAccounts(uuid);
  const { data: allAccounts } = useAllAccounts();
  const transferMutation = useTransferMutation(uuid);

  const [step, setStep] = React.useState(0);
  const [recipient, setRecipient] = React.useState<SBAccount | null>(null);
  const [from, setFrom] = React.useState<number>(-1);
  const [amountStr, setAmountStr] = React.useState("");
  const [concept, setConcept] = React.useState("");
  const [q, setQ] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");

  const mine = (myAccounts ?? []) as SBAccount[];
  const everyone = (allAccounts ?? []) as SBAccount[];

  React.useEffect(() => {
    if (from === -1 && mine.length > 0) setFrom(mine[0].id);
  }, [mine, from]);

  const fromAcc = mine.find((a) => a.id === from);
  const q2 = q.trim().toLowerCase();
  const myTargets = React.useMemo(
    () => mine.filter((a) => !q2 || a.name.toLowerCase().includes(q2)),
    [mine, q2],
  );
  const otherTargets = React.useMemo(
    () => everyone.filter((a) => !mine.some((m) => m.id === a.id) && (!q2 || a.name.toLowerCase().includes(q2))),
    [everyone, mine, q2],
  );

  const amount = parseAmount(amountStr);
  const canNext1 = !!recipient;
  const canNext2 =
    transferBlocker({ amount, fromId: fromAcc?.id, toId: recipient?.id, balance: fromAcc?.balance }) === null;

  function finish() {
    if (!recipient || !fromAcc) return;
    setError("");
    // `done` (the "¡Transferencia enviada!" screen) must only ever be set from
    // `onSuccess` — that fires exclusively when `rotomPOSTOrThrow` resolved, i.e. the
    // server's envelope really reported success. A rejected mutation calls `onError`
    // instead, so a failed transfer can never reach the success screen.
    const body: CreateTransferDto = {
      from: fromAcc.id,
      to: recipient.id,
      amount,
      concept: concept || "Transferencia",
    };
    transferMutation.mutate(body, {
      onSuccess: () => setDone(true),
      onError: (err) => setError(userMessageFrom(err, "No se pudo completar la transferencia")),
    });
  }

  if (done && recipient && fromAcc) {
    return (
      <div className="mx-auto mt-14 w-full max-w-[460px] animate-in fade-in duration-300">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-sb-pos-soft text-sb-pos">
            <Ico name="check" size={36} />
          </div>
          <h2 className="m-0 mb-1.5 font-sb-display text-[24px] font-semibold">¡Transferencia enviada!</h2>
          <div className="mb-4 text-sb-fg-muted">
            Has enviado <strong className="tabular-nums text-sb-fg">{formatMoney(amount)}</strong> a <strong>{displayName(recipient.name)}</strong>
          </div>
          <div className="mb-4 font-sb-display text-[48px] font-semibold tabular-nums text-sb-fg">{formatMoney(amount)}</div>
          <div className="rounded-sb-md bg-sb-surface-2 p-3.5 text-left text-[13px]">
            <div className="flex justify-between"><span className="text-sb-fg-muted">De</span><span>{displayName(fromAcc.name)}</span></div>
            <div className="mt-1.5 flex justify-between"><span className="text-sb-fg-muted">Concepto</span><span>{concept || "—"}</span></div>
            <div className="mt-1.5 flex justify-between"><span className="text-sb-fg-muted">Referencia</span><span className="font-mono">SR-{Date.now().toString().slice(-8)}</span></div>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => { transferMutation.reset(); setDone(false); setStep(0); setRecipient(null); setAmountStr(""); setConcept(""); }}>Nueva transferencia</Button>
            <Button variant="primary" href={`${BASE}/transacciones`}>Ver movimientos</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Enviar dinero" sub="Transfiere a otro entrenador, tienda o cuenta tuya" />

      <Card className="p-6">
        <Stepper steps={STEPS} current={step} />

        {step === 0 && (
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[18px]">
            <div>
              <Label htmlFor="recip">Buscar destinatario</Label>
              <div className="relative">
                <Ico name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-fg-subtle" />
                <Input id="recip" className="pl-9" placeholder="Nombre de la cuenta…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Mis cuentas</Label>
              <p className="-mt-1 mb-2 text-[12px] text-sb-fg-muted">Mueve dinero entre tus propias cuentas.</p>
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                {myTargets.map((c) => <RecipientCard key={c.id} account={c} selected={recipient?.id === c.id} onSelect={setRecipient} />)}
                {myTargets.length === 0 && <div className="col-span-full py-4 text-center text-[13px] text-sb-fg-muted">Sin coincidencias</div>}
              </div>
            </div>

            <div>
              <Label>Otras cuentas</Label>
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                {otherTargets.slice(0, 12).map((c) => <RecipientCard key={c.id} account={c} selected={recipient?.id === c.id} onSelect={setRecipient} />)}
                {otherTargets.length === 0 && <div className="col-span-full py-4 text-center text-[13px] text-sb-fg-muted">{q2 ? "Sin coincidencias" : "No hay otras cuentas"}</div>}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Button variant="ghost" href={BASE}>Cancelar</Button>
              <Button variant="primary" disabled={!canNext1} onClick={() => setStep(1)}>Continuar <Ico name="arrR" size={14} /></Button>
            </div>
          </div>
        )}

        {step === 1 && recipient && (
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
            <div className="flex items-center justify-center gap-2.5 rounded-sb-md bg-sb-surface-2 p-3.5">
              <span className="text-[13px] text-sb-fg-muted">Enviando a</span>
              <ContactAvatar name={recipient.name} type={recipient.type} image={recipient.image} id={recipient.id} size={28} />
              <strong>{displayName(recipient.name)}</strong>
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Cambiar</Button>
            </div>

            <div className="py-5 text-center">
              <Label className="text-center">Importe</Label>
              <input
                autoFocus
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="0"
                className="w-full border-0 bg-transparent text-center font-sb-display text-[56px] font-semibold tabular-nums tracking-[-0.03em] text-sb-fg caret-sb-600 outline-none"
              />
              <div className={cn("text-[13px]", fromAcc && amount > fromAcc.balance ? "text-sb-neg" : "text-sb-fg-muted")}>
                {fromAcc && amount > fromAcc.balance
                  ? `Excede el saldo disponible (${formatMoney(fromAcc.balance)})`
                  : `Disponible en ${fromAcc ? displayName(fromAcc.name) : "—"}: ${formatMoney(fromAcc?.balance ?? 0)}`}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((v) => (
                <button key={v} type="button" onClick={() => setAmountStr(v.toLocaleString("es-ES"))} className="rounded-sb-pill border border-sb-border bg-sb-surface px-3.5 py-2 text-[13px] font-medium transition-colors hover:border-sb-300 hover:bg-sb-50 hover:text-sb-700">
                  {formatMoney(v)}
                </button>
              ))}
            </div>

            <div>
              <Label htmlFor="from-acc">Pagar desde</Label>
              <Select id="from-acc" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
                {mine.map((a) => <option key={a.id} value={a.id}>{displayName(a.name)} — {formatMoney(a.balance)}</option>)}
              </Select>
              {recipient?.id === from && <p className="mt-1.5 text-[12px] font-medium text-sb-neg">Elige una cuenta de origen distinta al destinatario.</p>}
            </div>

            <div>
              <Label htmlFor="concept">Concepto (opcional)</Label>
              <Input id="concept" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Reembolso pokébolas" maxLength={50} />
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}><Ico name="arrL" size={14} /> Atrás</Button>
              <Button variant="primary" disabled={!canNext2} onClick={() => setStep(2)}>Revisar <Ico name="arrR" size={14} /></Button>
            </div>
          </div>
        )}

        {step === 2 && recipient && fromAcc && (
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-[18px]">
            <div className="text-center">
              <Label className="text-center">Vas a enviar</Label>
              <div className="font-sb-display text-[56px] font-bold tabular-nums tracking-[-0.02em]">{formatMoney(amount)}</div>
            </div>

            <div className="flex flex-col gap-3 rounded-sb-md bg-sb-surface-2 p-[18px]">
              <div className="flex items-center justify-between">
                <span className="text-sb-fg-muted">De</span>
                <span className="flex items-center gap-2"><AccountAvatar account={fromAcc} size={24} /><strong>{displayName(fromAcc.name)}</strong></span>
              </div>
              <div className="h-px bg-sb-border" />
              <div className="flex items-center justify-between">
                <span className="text-sb-fg-muted">A</span>
                <span className="flex items-center gap-2"><ContactAvatar name={recipient.name} type={recipient.type} image={recipient.image} id={recipient.id} size={24} /><strong>{displayName(recipient.name)}</strong></span>
              </div>
              <div className="h-px bg-sb-border" />
              <div className="flex items-center justify-between"><span className="text-sb-fg-muted">Concepto</span><span>{concept || "—"}</span></div>
              <div className="h-px bg-sb-border" />
              <div className="flex items-center justify-between"><span className="font-semibold">Total a debitar</span><span className="text-[16px] font-bold tabular-nums">{formatMoney(amount)}</span></div>
            </div>

            <div className="flex items-center gap-2.5 rounded-sb-md bg-sb-info-soft p-3 text-sb-info">
              <Ico name="shieldOk" size={16} />
              <span className="text-[12.5px]">Transferencia instantánea y protegida. Saldo proyectado tras la operación: <strong className="tabular-nums">{formatMoney(fromAcc.balance - amount)}</strong></span>
            </div>

            {error && <div className="text-[13px] font-medium text-sb-neg">{error}</div>}

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}><Ico name="arrL" size={14} /> Atrás</Button>
              <Button variant="primary" size="lg" onClick={finish} disabled={transferMutation.isPending}><Ico name="send" size={16} /> {transferMutation.isPending ? "Enviando…" : "Confirmar y enviar"}</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

function RecipientCard({ account: c, selected, onSelect }: { account: SBAccount; selected: boolean; onSelect: (a: SBAccount) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      className={cn(
        "flex flex-col items-center gap-2 rounded-sb-md border bg-sb-surface p-3.5 transition-all",
        selected ? "border-sb-600 bg-sb-50 shadow-sb-1" : "border-sb-border hover:border-sb-300 hover:bg-sb-50",
      )}
    >
      <ContactAvatar name={c.name} type={c.type} image={c.image} id={c.id} size={44} />
      <span className="text-center text-[13px] font-semibold">{displayName(c.name)}</span>
      <span className="text-[11px] text-sb-fg-muted">{c.type === "MAIN" ? "Principal" : "Secundaria"}</span>
    </button>
  );
}
