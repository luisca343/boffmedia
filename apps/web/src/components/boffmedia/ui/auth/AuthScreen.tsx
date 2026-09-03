"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { AuthProviderBtn, Button, Divider, Icon, toast } from "@boffmedia/ui"
import { ASSET, staticAsset } from "@/lib/assets"
import { CredentialsForm } from "./CredentialsForm"
import { ResendVerificationButton } from "./ResendVerificationButton"

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

/**
 * NextAuth's `pages.error` is this screen, so provider failures arrive here as
 * `?error=<code>`. Map the codes worth distinguishing; everything else falls
 * back to the generic message rather than showing the user a raw code.
 */
const ERROR_KEY: Record<string, string> = {
  CredentialsSignin: "signIn",
  AccessDenied: "accessDenied",
  OAuthAccountNotLinked: "accountNotLinked",
  SessionRequired: "sessionRequired",
  OAuthSignin: "oauth",
  OAuthCallback: "oauth",
  OAuthCreateAccount: "oauth",
  Callback: "oauth",
}

export function AuthScreen({
  discordEnabled = false,
  twitchEnabled = false,
}: {
  discordEnabled?: boolean
  twitchEnabled?: boolean
}) {
  const t = useTranslations("auth")
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get("redirect") || "/"
  const [isRegister, setIsRegister] = React.useState(params.get("mode") === "register")
  // Set once sign-up succeeds. A new account is unverified and the link expires
  // in 24h, so the screen stops here on a "check your inbox" panel instead of
  // dropping the player back on a login form that will let them in anyway and
  // then fail at the first thing that needs a verified address.
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null)

  // Surface (once) whatever NextAuth redirected here with, then strip the code
  // from the URL so a refresh does not re-announce a failure already handled.
  const error = params.get("error")
  React.useEffect(() => {
    if (!error) return
    toast.error(t(`errors.${ERROR_KEY[error] ?? "generic"}`))
    const qs = new URLSearchParams(params.toString())
    qs.delete("error")
    const s = qs.toString()
    router.replace(s ? `/entrar?${s}` : "/entrar", { scroll: false })
  }, [error, params, router, t])

  function switchMode(next: boolean) {
    setIsRegister(next)
    const qs = new URLSearchParams(params.toString())
    if (next) qs.set("mode", "register")
    else qs.delete("mode")
    const s = qs.toString()
    router.replace(s ? `/entrar?${s}` : "/entrar", { scroll: false })
  }

  function onRegistered(email: string) {
    toast.success(t("success.registerVerify"))
    setRegisteredEmail(email)
  }

  // Leaving the panel puts the form back in login mode, which is where someone
  // who just created an account is headed next.
  function leaveRegistered() {
    setRegisteredEmail(null)
    switchMode(false)
  }

  const soonHint = (provider: "discord" | "steam") => () =>
    toast(t("providers.soonHint", { provider: t(`providers.${provider}`) }))

  // Steam is link-only (from the profile) — it has no standalone login here.

  return (
    <div
      data-ds="boffmedia"
      data-footer-flush
      style={{ minHeight: "calc(100dvh - var(--nav-h))" }}
      className="relative flex flex-col items-center justify-center overflow-hidden px-5 py-14"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-50" style={GRID_BG} />

      <div className="relative z-[1] flex w-full max-w-[27.5rem] flex-col gap-[1.125rem] border border-line-2 border-t-[3px] border-t-accent bg-panel px-[2.125rem] pb-[1.875rem] pt-8 shadow-[0_40px_80px_-34px_rgba(0,0,0,0.75)] cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:16px] max-[480px]:px-5 max-[480px]:pt-[1.625rem] max-[480px]:pb-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[1.25rem]/none font-extrabold italic uppercase text-txt no-underline"
        >
          <img src={staticAsset(ASSET.boffmedia.brand, 'boff-logo.webp')} alt="" className="h-[1.625rem] w-[1.625rem] flex-none object-contain" />
          BOFF<b className="text-accent">MEDIA</b>
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.875rem]/[1.02] tracking-[0.01em] max-[480px]:text-[1.5625rem]">
            {registeredEmail
              ? t("registered.title")
              : isRegister
                ? t("register.title")
                : t("login.title")}
          </h1>
          <p className="font-body text-[0.875rem]/[1.5] not-italic normal-case text-txt-muted">
            {registeredEmail
              ? t.rich("registered.subtitle", {
                  address: registeredEmail,
                  b: (chunks) => <b className="text-txt">{chunks}</b>,
                })
              : isRegister
                ? t("register.subtitle")
                : t("login.subtitle")}
          </p>
        </div>

        {registeredEmail ? (
          <div className="flex flex-col gap-[0.8125rem]">
            <p className="font-body text-[0.84375rem]/[1.55] not-italic normal-case text-txt-muted">
              {t("registered.hint")}
            </p>
            <ResendVerificationButton email={registeredEmail} variant="pri" className="w-full" />
            <Button variant="ghost" className="w-full" onClick={leaveRegistered}>
              {t("registered.goLogin")}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              <AuthProviderBtn provider="google" block onClick={() => signIn("google", { callbackUrl: redirect })}>
                {t("providers.google")}
              </AuthProviderBtn>
              {discordEnabled ? (
                <AuthProviderBtn provider="discord" block onClick={() => signIn("discord", { callbackUrl: redirect })}>
                  {t("providers.discord")}
                </AuthProviderBtn>
              ) : (
                <AuthProviderBtn provider="discord" block soon title={t("providers.soon")} onClick={soonHint("discord")}>
                  {t("providers.discord")}
                </AuthProviderBtn>
              )}
              {twitchEnabled && (
                <AuthProviderBtn provider="twitch" block onClick={() => signIn("twitch", { callbackUrl: redirect })}>
                  {t("providers.twitch")}
                </AuthProviderBtn>
              )}
            </div>

            <Divider label={t("divider")} />

            <CredentialsForm
              key={isRegister ? "register" : "login"}
              isRegister={isRegister}
              redirect={redirect}
              onRegistered={onRegistered}
            />

            <p className="mt-0.5 text-center font-body text-[0.84375rem]/none not-italic normal-case text-txt-muted">
              {isRegister ? t("switch.toLoginQ") : t("switch.toRegisterQ")}
              <button
                type="button"
                onClick={() => switchMode(!isRegister)}
                className="ml-[0.4375rem] font-body text-[0.84375rem] font-bold text-accent hover:text-accent-bright hover:underline"
              >
                {isRegister ? t("switch.toLoginA") : t("switch.toRegisterA")}
              </button>
            </p>
          </>
        )}
      </div>

      <Link
        href="/"
        className="relative z-[1] mt-[1.375rem] inline-flex items-center gap-[0.4375rem] font-mono text-[0.6875rem]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> {t("back")}
      </Link>
    </div>
  )
}
