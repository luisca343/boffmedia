"use client";
import * as React from "react";
import useStarBank from "../_hooks/useStarBank";
import { useBoffSession } from "@/services/useBoffSession";
import { useCreateAccount } from "@/hooks/starbank/useCreateAccount";
import { PageHeader, Card, SectionHead, CardBody, Kpi, Button, Ico, AccountAvatar, Sheet, Label, Input, toast } from "../_components/ui";
import { formatMoney } from "../_utils/format";
import { displayName, accountColor } from "../_utils/account";
import { changeActiveAccount } from "../bankUtils";
import type { SBAccount } from "../_types";

const BASE = "/smartrotom/starbank";
const MAIN_BG =
  "radial-gradient(500px 250px at 95% 0%, rgba(96,165,250,.25), transparent 70%)," +
  "linear-gradient(135deg, #1e3a8a, #2463eb)";

export default function Cuentas() {
  const { session } = useBoffSession();
  const { accounts, activeAccount, setActiveAccount, fetchAccounts } = useStarBank();
  const [creating, setCreating] = React.useState(false);

  const list = (accounts ?? []) as SBAccount[];
  const total = list.reduce((s, a) => s + a.balance, 0);
  const main = list.find((a) => a.type === "MAIN");
  const secondary = list.filter((a) => a.type !== "MAIN");

  function select(id: number) {
    changeActiveAccount(id);
    setActiveAccount(id);
    const a = list.find((x) => x.id === id);
    if (a) toast(`Cuenta activa: ${displayName(a.name)}`);
  }

  return (
    <>
      <PageHeader
        title="Mis cuentas"
        sub="Organiza tu dinero entre tu cuenta principal y tus cuentas secundarias"
        actions={<Button variant="primary" onClick={() => setCreating(true)}><Ico name="plus" size={16} /> Nueva cuenta</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Balance total" value={formatMoney(total)} icon="card" tone="brand" sub={`Distribuido en ${list.length} cuentas`} />
        <Kpi label="Cuenta principal" value={main ? displayName(main.name) : "—"} icon="user" tone="brand" sub={formatMoney(main?.balance ?? 0)} />
        <Kpi label="Cuentas secundarias" value={`${secondary.length} activas`} icon="bag" tone="brand" sub={`Total: ${formatMoney(secondary.reduce((s, a) => s + a.balance, 0))}`} />
      </div>

      {main && (
        <div className="relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-sb-lg p-5 text-white" style={{ background: MAIN_BG }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <AccountAvatar account={main} size={56} square />
              <div>
                <div className="text-[12px] uppercase tracking-[0.06em] text-[#b6d3ff]">Cuenta principal</div>
                <div className="mt-1 text-[22px] font-semibold">{displayName(main.name)}</div>
                <button
                  type="button"
                  onClick={() => select(main.id)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-sb-pill border border-white/25 bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur-[8px] transition-colors hover:bg-white/25"
                >
                  {activeAccount?.id === main.id
                    ? <><span className="size-1.5 rounded-full bg-sb-pos-2" /> Cuenta activa</>
                    : "Seleccionar cuenta"}
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[#b6d3ff]">Saldo</div>
              <div className="font-sb-display text-[34px] font-bold tracking-[-0.02em] tabular-nums">{formatMoney(main.balance)}</div>
              <div className="mt-2.5 flex justify-end gap-2">
                <Button variant="glass" size="sm" href={`${BASE}/enviar`}><Ico name="send" size={14} /> Enviar</Button>
                <Button variant="solid" size="sm" href={`${BASE}/enviar`}><Ico name="arrows" size={14} /> Mover</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card flat className="border-0 bg-transparent shadow-none">
        <SectionHead eyebrow={`${secondary.length} activas`} title="Cuentas secundarias" action={<Button variant="secondary" size="sm" onClick={() => setCreating(true)}><Ico name="plus" size={14} /> Añadir</Button>} />
        <CardBody noPad>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {secondary.map((acc) => {
              const active = activeAccount?.id === acc.id;
              const color = accountColor(acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => select(acc.id)}
                  style={{ borderLeft: `4px solid ${color}` }}
                  className="flex min-h-[180px] flex-col justify-between rounded-sb-lg border border-sb-border bg-sb-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-sb-300 hover:shadow-sb-2"
                >
                  <div className="flex items-start justify-between">
                    <AccountAvatar account={acc} size={44} square />
                    <span
                      className="inline-flex h-6 items-center gap-1.5 rounded-sb-pill px-2.5 text-[11.5px] font-semibold"
                      style={{ background: color + "1a", color }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: color }} />
                      {active ? "Activa" : "Secundaria"}
                    </span>
                  </div>
                  <div>
                    <div className="text-[16px] font-semibold">{displayName(acc.name)}</div>
                    <div className="text-[12px] text-sb-fg-muted">Cuenta secundaria</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-sb-display text-[22px] font-semibold tabular-nums tracking-[-0.01em]">{formatMoney(acc.balance)}</div>
                    <span className="text-sb-fg-muted"><Ico name="arrR" size={16} /></span>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="grid min-h-[180px] place-items-center rounded-sb-lg border-2 border-dashed border-sb-border-strong text-sb-fg-muted transition-colors hover:border-sb-300 hover:bg-sb-50 hover:text-sb-700"
            >
              <div className="text-center">
                <div className="mx-auto mb-2.5 grid size-11 place-items-center rounded-xl bg-sb-surface-3 text-sb-600">
                  <Ico name="plus" size={20} />
                </div>
                <div className="font-semibold">Nueva cuenta secundaria</div>
                <div className="mt-0.5 text-[12px]">Ahorros, gastos, viajes…</div>
              </div>
            </button>
          </div>
        </CardBody>
      </Card>

      {creating && (
        <CreateAccountDialog
          uuid={session?.user?.smartRotomUser?.uuid}
          onClose={() => setCreating(false)}
          onCreated={() => {
            if (session) fetchAccounts(session);
            setCreating(false);
            toast("Cuenta creada");
          }}
        />
      )}
    </>
  );
}

function CreateAccountDialog({ uuid, onClose, onCreated }: { uuid?: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const { createAccount } = useCreateAccount();

  async function submit() {
    if (!name.trim() || !uuid) {
      setError("Introduce un nombre para la cuenta");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createAccount({ name: name.trim(), uuid });
      onCreated();
    } catch {
      setError("No se pudo crear la cuenta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet width={460} onClose={onClose} eyebrow="Cuenta secundaria" title="Nueva cuenta">
      <div className="flex items-start gap-2.5 rounded-sb-md border border-sb-border bg-sb-info-soft p-3 text-[13px] text-sb-info">
        <Ico name="info" size={16} className="mt-0.5 shrink-0" />
        <span>Las cuentas secundarias te permiten organizar tu dinero para ahorros, gastos o viajes.</span>
      </div>
      <div>
        <Label htmlFor="acc-name">Nombre de la cuenta</Label>
        <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ahorros Liga" maxLength={40} autoFocus />
      </div>
      {error && <div className="text-[13px] font-medium text-sb-neg">{error}</div>}
      <div className="mt-auto flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={submit} disabled={busy || !name.trim()}>{busy ? "Creando…" : "Crear cuenta"}</Button>
      </div>
    </Sheet>
  );
}
