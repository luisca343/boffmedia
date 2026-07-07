"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { AuthProviderBtn, Divider, Icon, toast } from "@/components/boffmedia/primitives"
import { CredentialsForm } from "./CredentialsForm"

const GRID_BG: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(120% 80% at 50% -10%, var(--accent-soft), transparent 60%)",
    "linear-gradient(var(--line) 1px, transparent 1px)",
    "linear-gradient(90deg, var(--line) 1px, transparent 1px)",
  ].join(","),
  backgroundSize: "100% 100%, 100% 48px, 48px 100%",
  WebkitMaskImage: "radial-gradient(90% 70% at 50% 30%, #000 30%, transparent 78%)",
  maskImage: "radial-gradient(90% 70% at 50% 30%, #000 30%, transparent 78%)",
}

export function AuthScreen() {
  const t = useTranslations("auth")
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get("redirect") || "/"
  const [isRegister, setIsRegister] = React.useState(params.get("mode") === "register")

  function switchMode(next: boolean) {
    setIsRegister(next)
    const qs = new URLSearchParams(params.toString())
    if (next) qs.set("mode", "register")
    else qs.delete("mode")
    const s = qs.toString()
    router.replace(s ? `/entrar?${s}` : "/entrar", { scroll: false })
  }

  function onRegistered() {
    toast.success(t("success.register"))
    switchMode(false)
  }

  const soonHint = (provider: "discord" | "steam") => () =>
    toast(t("providers.soonHint", { provider: t(`providers.${provider}`) }))

  return (
    <div
      data-ds="boffmedia"
      data-footer-flush
      style={{ minHeight: "calc(100dvh - var(--nav-h))" }}
      className="relative flex flex-col items-center justify-center overflow-hidden px-5 py-14"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-50" style={GRID_BG} />

      <div className="relative z-[1] flex w-full max-w-[440px] flex-col gap-[18px] border border-line-2 border-t-[3px] border-t-accent bg-panel px-[34px] pb-[30px] pt-8 shadow-[0_40px_80px_-34px_rgba(0,0,0,0.75)] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%)] max-[480px]:px-5 max-[480px]:pt-[26px] max-[480px]:pb-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[20px]/none font-extrabold italic uppercase text-txt no-underline"
        >
          BOFF<b className="text-accent">MEDIA</b>
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px]/[1.02] tracking-[0.01em] max-[480px]:text-[25px]">
            {isRegister ? t("register.title") : t("login.title")}
          </h1>
          <p className="font-body text-[14px]/[1.5] not-italic normal-case text-txt-muted">
            {isRegister ? t("register.subtitle") : t("login.subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <AuthProviderBtn provider="google" block onClick={() => signIn("google", { callbackUrl: redirect })}>
            {t("providers.google")}
          </AuthProviderBtn>
          <div className="grid grid-cols-2 gap-2.5 max-[480px]:grid-cols-1">
            <AuthProviderBtn provider="discord" soon title={t("providers.soon")} onClick={soonHint("discord")}>
              {t("providers.discord")}
            </AuthProviderBtn>
            <AuthProviderBtn provider="steam" soon title={t("providers.soon")} onClick={soonHint("steam")}>
              {t("providers.steam")}
            </AuthProviderBtn>
          </div>
        </div>

        <Divider label={t("divider")} />

        <CredentialsForm
          key={isRegister ? "register" : "login"}
          isRegister={isRegister}
          redirect={redirect}
          onRegistered={onRegistered}
        />

        <p className="mt-0.5 text-center font-body text-[13.5px]/none not-italic normal-case text-txt-muted">
          {isRegister ? t("switch.toLoginQ") : t("switch.toRegisterQ")}
          <button
            type="button"
            onClick={() => switchMode(!isRegister)}
            className="ml-[7px] font-body text-[13.5px] font-bold text-accent hover:text-accent-bright hover:underline"
          >
            {isRegister ? t("switch.toLoginA") : t("switch.toRegisterA")}
          </button>
        </p>
      </div>

      <Link
        href="/"
        className="relative z-[1] mt-[22px] inline-flex items-center gap-[7px] font-mono text-[11px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> {t("back")}
      </Link>
    </div>
  )
}
