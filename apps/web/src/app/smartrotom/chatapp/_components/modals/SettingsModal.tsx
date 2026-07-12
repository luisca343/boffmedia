"use client";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getSmartRotomUser } from "@/lib/utils";
import { Avatar, Icon, Modal, Toggle, type IconName } from "../ui";
import { useChatSettings } from "../../_stores/useChatSettings";
import { ACCENTS } from "../../_utils/theme";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <h6 className="mb-2.5 text-[13px] font-semibold text-ca-accent-soft">{title}</h6>
      {children}
    </div>
  );
}

function ToggleRow({ icon, label, desc, on, onClick }: { icon: IconName; label: string; desc?: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-[14.5px] text-ca-100">
      <Icon name={icon} size={18} className="flex-none text-ca-400" />
      <div className="flex-1">
        <div>{label}</div>
        {desc && <div className="text-[11.5px] text-ca-500">{desc}</div>}
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

export function SettingsModal({ session, onClose }: { session: unknown; onClose: () => void }) {
  const { accent, setAccent } = useChatSettings();
  const me = getSmartRotomUser(session);
  // [deferred] privacy/notification prefs have no settings API — presentational only
  const [prefs, setPrefs] = useState({ receipts: true, lastseen: true, preview: true, sounds: true, enter: true, quiet: false });
  const flip = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <Modal title="Ajustes" icon="settings" onClose={onClose}>
      <div className="mb-1.5 flex items-center gap-3 border-b border-ca-800 pb-3.5">
        <Avatar src={`https://mc-heads.net/avatar/${me?.uuid}`} size={52} />
        <div>
          <div className="text-[16px] font-bold text-ca-50">{me?.username}</div>
          <div className="text-[12.5px] text-ca-400">Conectado · multi-dispositivo</div>
        </div>
      </div>

      <Section title="Apariencia">
        {/* Light/dark moved to the platform picker (Ajustes → Temas) so one choice
            drives every SmartRotom app. The accent stays here — it is ChatApp's own. */}
        <p className="mb-3 flex items-center gap-2 rounded-ca-md border border-ca-800 bg-ca-800 px-3 py-2 text-[12.5px] text-ca-400">
          <Icon name="settings" size={15} className="flex-none text-ca-500" />
          El modo claro/oscuro se elige en los ajustes de SmartRotom, en «Temas».
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

      <Section title="Privacidad">
        <ToggleRow icon="checks" label="Confirmaciones de lectura" desc="Mostrar el doble check azul" on={prefs.receipts} onClick={() => flip("receipts")} />
        <ToggleRow icon="eye" label="Última conexión" on={prefs.lastseen} onClick={() => flip("lastseen")} />
        <ToggleRow icon="lock" label="Vista previa en notificaciones" on={prefs.preview} onClick={() => flip("preview")} />
      </Section>

      <Section title="Notificaciones">
        <ToggleRow icon="volume" label="Sonidos" on={prefs.sounds} onClick={() => flip("sounds")} />
        <ToggleRow icon="bell" label="Modo concentración" desc="Silencia chats no fijados mientras juegas" on={prefs.quiet} onClick={() => flip("quiet")} />
      </Section>

      <Section title="Chat">
        <ToggleRow icon="send" label="Enter para enviar" on={prefs.enter} onClick={() => flip("enter")} />
      </Section>
    </Modal>
  );
}
