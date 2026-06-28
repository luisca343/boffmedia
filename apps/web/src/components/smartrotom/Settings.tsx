"use client"
import { isMinecraft } from "@/services/mcef/mcefHelper";
import { env } from "@/config/env.public";
import { useBoffSession } from "@/services/useBoffSession";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { SmartRotomButton } from "@/components/smartrotom/ui/button";
import { Copy, Check, LogIn, LogOut, Palette, Bug, Monitor, Smartphone } from "lucide-react";

const isDev = env.NODE_ENV === "development";

const themes = [
  { id: '', label: 'Clásico', colors: ['bg-layer-2', 'bg-layer-3', 'bg-primary'] },
  { id: 'theme-light', label: 'Claro', colors: ['bg-white', 'bg-layer-2', 'bg-primary'] },
  { id: 'theme-tulipan', label: 'Tulipán', colors: ['bg-pink-50', 'bg-pink-100', 'bg-pink-500'] },
  { id: 'theme-mizu', label: 'Mizu', colors: ['bg-cyan-50', 'bg-cyan-100', 'bg-cyan-500'] },
  { id: 'theme-oasis', label: 'Oasis', colors: ['bg-amber-50', 'bg-amber-100', 'bg-amber-500'] },
];

export function SettingsPage({ setTema }: { setTema: (tema: string) => void }) {
  const { session } = useBoffSession();
  const [copied, setCopied] = useState(false);
  const [activeTheme, setActiveTheme] = useState('');

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
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        {isMinecraft() ? (
          <Smartphone size={14} className="text-primary-hover" />
        ) : (
          <Monitor size={14} className="text-primary-hover" />
        )}
        <span className="font-medium uppercase tracking-wider">
          {isMinecraft() ? 'SmartRotom' : 'Browser'}
        </span>
      </div>

      {/* Themes Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-primary-hover" />
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Temas</h3>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`
                group relative flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all duration-150
                ${activeTheme === theme.id
                  ? 'border-primary bg-primary/10 shadow-light'
                  : 'border-edge hover:border-edge bg-layer-3/50 hover:bg-layer-3'
                }
              `}
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
              <span className={`
                text-[10px] font-medium leading-none
                ${activeTheme === theme.id ? 'text-primary-hover' : 'text-ink-muted group-hover:text-ink'}
              `}>
                {theme.label}
              </span>
              {/* Active indicator */}
              {activeTheme === theme.id && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-hover rounded-full border-2 border-edge-strong" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Auth Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <LogIn size={16} className="text-primary-hover" />
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Sesión</h3>
        </div>
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
          <div className="flex items-center gap-2 mb-3">
            <Bug size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Debug</h3>
          </div>
          <div className="bg-layer-1/80 border-2 border-edge rounded-lg overflow-hidden">
            {/* Session info header */}
            <div className="flex items-center justify-between px-3 py-2 bg-layer-3/50 border-b border-edge">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] text-ink-muted font-mono">session.json</span>
              </div>
              {session?.user?.accessToken && (
                <SmartRotomButton
                  onClick={copyToken}
                  variant={copied ? "default" : "neutral"}
                  size="sm"
                  className="gap-1.5 h-7 px-2"
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
              <pre className="text-[11px] leading-relaxed text-ink font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
