"use client"
import { isMinecraft } from "@/services/mcef/mcefHelper";
import { env } from "@/config/env.public";
import { useBoffSession } from "@/services/useBoffSession";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SmartRotomButton } from "@/components/smartrotom/ui";
import { Copy, Check, LogIn, LogOut, Palette, Bug, Monitor, Smartphone, Sun } from "lucide-react";
import { ROTOM_THEMES } from "@/components/smartrotom/theme/rotomTheme";
import { useRotomMode, useRotomThemeStore } from "@/components/smartrotom/theme/useRotomTheme";

const isDev = env.NODE_ENV === "development";

function SectionLabel({ icon: Icon, children }: { icon: typeof Sun; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-sr-accent" />
      <h3 className="font-display text-sm font-bold not-italic uppercase tracking-[0.06em] text-sr-txt">
        {children}
      </h3>
    </div>
  );
}

const tileBase =
  "group flex flex-col items-center gap-1.5 p-2 cut [--cut:6px] border transition-[background,border-color] duration-150";
const tileActive = "border-sr-accent bg-sr-accent-soft";
const tileIdle = "border-sr-line bg-sr-panel hover:bg-sr-panel-2 hover:border-sr-line-2";

export function SettingsPage() {
  const { session } = useBoffSession();
  const [copied, setCopied] = useState(false);
  const theme = useRotomThemeStore((s) => s.theme);
  const setTheme = useRotomThemeStore((s) => s.setTheme);
  // What the themeable apps (ChatApp, Notas) will actually render under this choice.
  const mode = useRotomMode();

  const copyToken = () => {
    if (session?.user?.accessToken) {
      navigator.clipboard.writeText(session.user.accessToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Device Status */}
      <div className="flex items-center gap-2 mono-label !text-sr-txt-muted">
        {isMinecraft() ? (
          <Smartphone size={14} className="text-sr-accent" />
        ) : (
          <Monitor size={14} className="text-sr-accent" />
        )}
        <span>{isMinecraft() ? 'SmartRotom' : 'Browser'}</span>
      </div>

      {/*
        One theme control for the whole of SmartRotom. It used to be two — this grid
        (which set a class nothing styled) plus a separate "Modo del chat" that only
        ChatApp read. Now the themeable apps derive their light/dark from this choice,
        so a theme with no app-specific skin still lands somewhere sensible.
      */}
      <div>
        <SectionLabel icon={Palette}>Temas</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {ROTOM_THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={active}
                className={cn(tileBase, active ? tileActive : tileIdle)}
              >
                <div className="flex gap-0.5">
                  {t.swatches.map((swatch, i) => (
                    <div key={i} className={cn("w-3 h-3 rounded-full border border-black/20", swatch)} />
                  ))}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "text-sr-accent-bright" : "text-sr-txt-muted group-hover:text-sr-txt",
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] leading-none text-sr-txt-dim">
          <Sun size={11} className="text-sr-txt-dim" />
          Las apps con tema propio (Chat, Notas) se muestran en{" "}
          <strong className="font-medium text-sr-txt-muted">{mode === "dark" ? "oscuro" : "claro"}</strong>.
        </p>
      </div>

      {/* Auth Section */}
      <div>
        <SectionLabel icon={LogIn}>Sesión</SectionLabel>
        <div className="flex gap-2">
          <SmartRotomButton
            onClick={() => signIn('boffmedia')}
            variant="default"
            size="sm"
            className="gap-2 flex-1"
          >
            <LogIn size={14} />
            Iniciar sesión
          </SmartRotomButton>
          <SmartRotomButton
            onClick={() => signOut()}
            variant="neutral"
            size="sm"
            className="gap-2 flex-1"
          >
            <LogOut size={14} />
            Cerrar sesión
          </SmartRotomButton>
        </div>
      </div>

      {/* Debug Section (Dev Only) */}
      {isDev && session && (
        <div>
          <SectionLabel icon={Bug}>Debug</SectionLabel>
          <div className="bg-sr-bg border border-sr-line cut-corner [--cut-lg:10px] overflow-hidden">
            {/* Session info header */}
            <div className="flex items-center justify-between px-3 py-2 bg-sr-panel-2 border-b border-sr-line">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-sr-bad" />
                  <div className="w-2 h-2 rounded-full bg-sr-warn" />
                  <div className="w-2 h-2 rounded-full bg-sr-ok" />
                </div>
                <span className="text-[10px] text-sr-txt-muted font-mono">session.json</span>
              </div>
              {session?.user?.accessToken && (
                <SmartRotomButton
                  onClick={copyToken}
                  variant={copied ? "default" : "neutral"}
                  size="sm"
                  className="gap-1.5 !py-1 !px-2"
                >
                  {copied ? (
                    <>
                      <Check size={12} />
                      <span className="text-[10px]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span className="text-[10px]">Token</span>
                    </>
                  )}
                </SmartRotomButton>
              )}
            </div>
            {/* JSON content */}
            <div className="p-3 max-h-40 overflow-auto scrollbar-thin">
              <pre className="text-[11px] leading-relaxed text-sr-txt font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
