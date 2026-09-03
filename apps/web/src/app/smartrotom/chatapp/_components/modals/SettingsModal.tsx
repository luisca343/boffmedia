"use client";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getSmartRotomUser } from "@/lib/utils";
import { Avatar, Icon, Modal, Toggle, type IconName } from "../ui";
import { useChatSettings } from "../../_stores/useChatSettings";
import { ACCENTS } from "../../_utils/theme";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <h6 className="mb-2.5 text-[0.8125rem] font-semibold text-ca-accent-soft">{title}</h6>
      {children}
    </div>
  );
}

function ToggleRow({ icon, label, desc, on, onClick }: { icon: IconName; label: string; desc?: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-[0.90625rem] text-ca-100">
      <Icon name={icon} size={18} className="flex-none text-ca-400" />
      <div className="flex-1">
        <div>{label}</div>
        {desc && <div className="text-[0.71875rem] text-ca-500">{desc}</div>}
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

export function SettingsModal({ session, onClose }: { session: unknown; onClose: () => void }) {
  const t = useTranslations("chatapp");
  const { accent, setAccent } = useChatSettings();
  const me = getSmartRotomUser(session);
  // [deferred] privacy/notification prefs have no settings API — presentational only
  const [prefs, setPrefs] = useState({ receipts: true, lastseen: true, preview: true, sounds: true, enter: true, quiet: false });
  const flip = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <Modal title={t("settingsModal.title")} icon="settings" onClose={onClose}>
      <div className="mb-1.5 flex items-center gap-3 border-b border-ca-800 pb-3.5">
        <Avatar src={`https://mc-heads.net/avatar/${me?.uuid}`} size={52} />
        <div>
          <div className="text-[1rem] font-bold text-ca-50">{me?.username}</div>
          <div className="text-[0.78125rem] text-ca-400">{t("settingsModal.connected")}</div>
        </div>
      </div>

      <Section title={t("settingsModal.appearance")}>
        {/* Light/dark moved to the platform picker (Ajustes → Temas) so one choice
            drives every SmartRotom app. The accent stays here — it is ChatApp's own. */}
        <p className="mb-3 flex items-center gap-2 rounded-ca-md border border-ca-800 bg-ca-800 px-3 py-2 text-[0.78125rem] text-ca-400">
          <Icon name="settings" size={15} className="flex-none text-ca-500" />
          {t("settingsModal.accentHint")}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              aria-label={`Acento ${c}`}
              className={cn("h-8 w-8 rounded-full transition-transform active:scale-90", accent === c && "ring-2 ring-ca-50 ring-offset-2 ring-offset-ca-panel")}
              style={{ background: c }}
            />
          ))}
        </div>
      </Section>

      <Section title={t("settingsModal.privacy")}>
        <ToggleRow icon="checks" label={t("settingsModal.readReceipts")} desc={t("settingsModal.readReceiptsDesc")} on={prefs.receipts} onClick={() => flip("receipts")} />
        <ToggleRow icon="eye" label={t("settingsModal.lastSeen")} on={prefs.lastseen} onClick={() => flip("lastseen")} />
        <ToggleRow icon="lock" label={t("settingsModal.notifPreview")} on={prefs.preview} onClick={() => flip("preview")} />
      </Section>

      <Section title={t("settingsModal.notifications")}>
        <ToggleRow icon="volume" label={t("settingsModal.sounds")} on={prefs.sounds} onClick={() => flip("sounds")} />
        <ToggleRow icon="bell" label={t("settingsModal.focusMode")} desc={t("settingsModal.focusModeDesc")} on={prefs.quiet} onClick={() => flip("quiet")} />
      </Section>

      <Section title={t("settingsModal.chat")}>
        <ToggleRow icon="send" label={t("settingsModal.enterToSend")} on={prefs.enter} onClick={() => flip("enter")} />
      </Section>
    </Modal>
  );
}
