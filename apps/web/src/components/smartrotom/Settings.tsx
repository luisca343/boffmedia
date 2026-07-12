"use client"
import { isMinecraft } from "@/services/mcef/mcefHelper";
import { env } from "@/config/env.public";
import { useBoffSession } from "@/services/useBoffSession";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SmartRotomButton } from "@/components/smartrotom/ui";
import { Copy, Check, LogIn, LogOut, Palette, Bug, Monitor, Smartphone, Sun, Moon } from "lucide-react";
import { useChatSettings } from "@/app/smartrotom/chatapp/_stores/useChatSettings";
import type { ThemePref } from "@/app/smartrotom/chatapp/_utils/theme";

const isDev = env.NODE_ENV === "development";

const themes = [
  { id: '', label: 'Clásico', colors: ['bg-layer-2', 'bg-layer-3', 'bg-primary'] },
  { id: 'theme-light', label: 'Claro', colors: ['bg-white', 'bg-layer-2', 'bg-primary'] },
  { id: 'theme-tulipan', label: 'Tulipán', colors: ['bg-pink-50', 'bg-pink-100', 'bg-pink-500'] },
  { id: 'theme-mizu', label: 'Mizu', colors: ['bg-cyan-50', 'bg-cyan-100', 'bg-cyan-500'] },
  { id: 'theme-oasis', label: 'Oasis', colors: ['bg-amber-50', 'bg-amber-100', 'bg-amber-500'] },
];

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

export function SettingsPage({ setTema }: { setTema: (tema: string) => void }) {
  const { session } = useBoffSession();
  const [copied, setCopied] = useState(false);
  const [activeTheme, setActiveTheme] = useState('');
  const { theme: chatMode, setTheme: setChatMode } = useChatSettings();

  const copyToken = () => {
    if (session?.user?.accessToken) {
      navigator.clipboard.writeText(session.user.accessToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    setTema(themeId);
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

      {/* Themes Section */}
      <div>
        <SectionLabel icon={Palette}>Temas</SectionLabel>
        <div className="grid grid-cols-5 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={cn(tileBase, activeTheme === theme.id ? tileActive : tileIdle)}
            >
              {/* Color preview dots */}
              <div className="flex gap-0.5">
                {theme.colors.map((color, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border border-black/20 ${color}`}
                  />
                ))}
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none",
                activeTheme === theme.id ? "text-sr-accent-bright" : "text-sr-txt-muted group-hover:text-sr-txt"
              )}>
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat light/dark mode */}
      <div>
        <SectionLabel icon={Sun}>Modo del chat</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "light", label: "Claro", icon: Sun },
            { id: "dark", label: "Oscuro", icon: Moon },
            { id: "auto", label: "Auto", icon: Monitor },
          ] as { id: ThemePref; label: string; icon: typeof Sun }[]).map((m) => {
            const MIcon = m.icon;
            const active = chatMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setChatMode(m.id)}
                className={cn(tileBase, active ? tileActive : tileIdle)}
              >
                <MIcon size={16} className={active ? "text-sr-accent-bright" : "text-sr-txt-muted group-hover:text-sr-txt"} />
                <span className={cn("text-[10px] font-medium leading-none", active ? "text-sr-accent-bright" : "text-sr-txt-muted group-hover:text-sr-txt")}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
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
