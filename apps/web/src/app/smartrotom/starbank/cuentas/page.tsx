"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import useStarBank from "../_hooks/useStarBank";
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid";
import { useCreateAccountMutation } from "../_hooks/queries";
import { userMessageFrom } from "@/services/boffAPI";
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
  const t = useTranslations("starbank");
  const uuid = useRotomUuid();
  const { accounts, activeAccount, setActiveAccount } = useStarBank();
  const [creating, setCreating] = React.useState(false);

  const list = (accounts ?? []) as SBAccount[];
  const total = list.reduce((s, a) => s + a.balance, 0);
  const main = list.find((a) => a.type === "MAIN");
  const secondary = list.filter((a) => a.type !== "MAIN");

  function select(id: number) {
    changeActiveAccount(id);
    setActiveAccount(id);
    const a = list.find((x) => x.id === id);
    if (a) toast(t("cuentas.dialog.created"));
  }

  return (
    <>
      <PageHeader
        title={t("cuentas.title")}
        sub={t("cuentas.sub")}
        actions={<Button variant="primary" onClick={() => setCreating(true)}><Ico name="plus" size={16} /> {t("cuentas.newAccount")}</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label={t("cuentas.totalBalance")} value={formatMoney(total)} icon="card" tone="brand" sub={t("cuentas.distributedIn", { count: list.length })} />
        <Kpi label={t("cuentas.mainAccount")} value={main ? displayName(main.name) : "—"} icon="user" tone="brand" sub={formatMoney(main?.balance ?? 0)} />
        <Kpi label={t("cuentas.secondaryAccounts")} value={t("cuentas.activeAccounts", { count: secondary.length })} icon="bag" tone="brand" sub={`${t("accounts.totalBalance")}: ${formatMoney(secondary.reduce((s, a) => s + a.balance, 0))}`} />
      </div>

      {main && (
        <div className="relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-sb-lg p-5 text-white" style={{ background: MAIN_BG }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <AccountAvatar account={main} size={56} square />
              <div>
                <div className="text-[12px] uppercase tracking-[0.06em] text-[#b6d3ff]">{t("cuentas.mainAccount")}</div>
                <div className="mt-1 text-[22px] font-semibold">{displayName(main.name)}</div>
                <button
                  type="button"
                  onClick={() => select(main.id)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-sb-pill border border-white/25 bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur-[8px] transition-colors hover:bg-white/25"
                >
                  {activeAccount?.id === main.id
                    ? <><span className="size-1.5 rounded-full bg-sb-pos-2" /> {t("cuentas.activeAccount")}</>
                    : t("cuentas.selectAccount")}
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[#b6d3ff]">{t("cuentas.balance")}</div>
              <div className="font-sb-display text-[34px] font-bold tracking-[-0.02em] tabular-nums">{formatMoney(main.balance)}</div>
              <div className="mt-2.5 flex justify-end gap-2">
                <Button variant="glass" size="sm" href={`${BASE}/enviar`}><Ico name="send" size={14} /> {t("cuentas.send")}</Button>
                <Button variant="solid" size="sm" href={`${BASE}/enviar`}><Ico name="arrows" size={14} /> {t("cuentas.move")}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card flat className="border-0 bg-transparent shadow-none">
        <SectionHead eyebrow={t("cuentas.activeAccounts", { count: secondary.length })} title={t("cuentas.secondaryAccounts")} action={<Button variant="secondary" size="sm" onClick={() => setCreating(true)}><Ico name="plus" size={14} /> {t("cuentas.add")}</Button>} />
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
                      {active ? t("cuentas.active") : t("accounts.secondary")}
                    </span>
                  </div>
                  <div>
                    <div className="text-[16px] font-semibold">{displayName(acc.name)}</div>
                    <div className="text-[12px] text-sb-fg-muted">{t("cuentas.secondaryAccount")}</div>
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
                <div className="font-semibold">{t("cuentas.newSecondary")}</div>
                <div className="mt-0.5 text-[12px]">{t("cuentas.newSecondarySub")}</div>
              </div>
            </button>
          </div>
        </CardBody>
      </Card>

      {creating && (
        <CreateAccountDialog
          uuid={uuid ?? undefined}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            toast(t("cuentas.dialog.created"));
          }}
        />
      )}
    </>
  );
}

function CreateAccountDialog({ uuid, onClose, onCreated }: { uuid?: string; onClose: () => void; onCreated: () => void }) {
  const t = useTranslations("starbank");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const createAccount = useCreateAccountMutation(uuid);

  function submit() {
    if (!name.trim() || !uuid) {
      setError(t("cuentas.dialog.errorEmpty"));
      return;
    }
    setError("");
    createAccount.mutate(
      { data: { name: name.trim(), uuid } },
      {
        onSuccess: onCreated,
        onError: (err) => setError(userMessageFrom(err, t("cuentas.dialog.errorFailed"))),
      },
    );
  }

  return (
    <Sheet width={460} onClose={onClose} eyebrow={t("cuentas.dialog.eyebrow")} title={t("cuentas.dialog.title")}>
      <div className="flex items-start gap-2.5 rounded-sb-md border border-sb-border bg-sb-info-soft p-3 text-[13px] text-sb-info">
        <Ico name="info" size={16} className="mt-0.5 shrink-0" />
        <span>{t("cuentas.dialog.info")}</span>
      </div>
      <div>
        <Label htmlFor="acc-name">{t("cuentas.dialog.nameLabel")}</Label>
        <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("cuentas.dialog.namePlaceholder")} maxLength={40} autoFocus />
      </div>
      {error && <div className="text-[13px] font-medium text-sb-neg">{error}</div>}
      <div className="mt-auto flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="primary" onClick={submit} disabled={createAccount.isPending || !name.trim()}>{createAccount.isPending ? t("cuentas.dialog.creating") : t("cuentas.dialog.create")}</Button>
      </div>
    </Sheet>
  );
}
