"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useSubscribeNewsletter } from "../_hooks/queries";
import { Button, Eyebrow, FurretMascot, Input, Marquee, Meta, toast } from "./ui";

const BASE = "/smartrotom/furrettoday";

const SECTIONS = [
  { href: BASE, labelKey: "nav.home" },
  { href: `${BASE}/secciones`, labelKey: "nav.sections" },
  { href: `${BASE}/secciones#archivo`, labelKey: "nav.archive" },
  { href: `${BASE}/editar`, labelKey: "nav.edit" },
];

// Proper nouns — app names, never translated.
const SMARTROTOM = [
  { href: "/smartrotom", label: "SmartRotom" },
  { href: "/smartrotom/pokedex", label: "Pokédex" },
  { href: "/smartrotom/arcade", label: "Arcade" },
  { href: "/smartrotom/notas", label: "Notas" },
];

export function FurretFooter() {
  const t = useTranslations("furrettoday");
  const [email, setEmail] = useState("");
  const subscribe = useSubscribeNewsletter();

  function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    subscribe.mutate(value, {
      onSuccess: () => {
        setEmail("");
        toast(t("footer.newsletterSuccess"));
      },
      onError: () => toast.error(t("footer.newsletterError")),
    });
  }

  return (
    <footer className="mt-16 bg-ft-ink text-ft-paper">
      <Marquee
        items={Array.from({ length: 7 }, () => t("furretFooter.marqueeItem"))}
        tone="pink"
        label={t("furretFooter.marqueeLabel")}
      />

      <div className="mx-auto grid max-w-[87.5rem] gap-8 px-6 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <FurretMascot size={48} />
            <span className="font-ft-display text-[1.75rem] text-ft-yellow">
              FURRET·TODAY
            </span>
          </div>
          <p className="max-w-[22.5rem] text-white/75">
            {t("furretFooter.tagline")}
          </p>
        </div>

        <div>
          <Eyebrow className="mb-3 text-ft-pink">{t("furretFooter.sections")}</Eyebrow>
          <ul className="grid gap-2">
            {SECTIONS.map((s) => (
              <li key={s.labelKey}>
                <Link
                  href={s.href}
                  className="font-ft-ui font-semibold text-white hover:text-ft-yellow"
                >
                  {t(s.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Eyebrow className="mb-3 text-ft-pink">SmartRotom</Eyebrow>
          <ul className="grid gap-2">
            {SMARTROTOM.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="font-ft-ui font-semibold text-white hover:text-ft-yellow"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Eyebrow className="mb-3 text-ft-pink">{t("furretFooter.subscribe")}</Eyebrow>
          <p className="mb-3 text-sm text-white/75">
            {t("furretFooter.subscribeBlurb")}
          </p>
          <form onSubmit={onSubscribe} className="flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("footer.emailPlaceholder")}
              aria-label={t("footer.emailAriaLabel")}
              className="flex-1 border-ft-yellow shadow-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={subscribe.isPending}
            >
              {subscribe.isPending ? t("furretFooter.submitting") : t("furretFooter.submit")}
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-white/20">
        <div className="mx-auto flex max-w-[87.5rem] flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Meta className="text-white/60">
            {t("furretFooter.copyright", { year: new Date().getFullYear() })}
          </Meta>
          <Meta className="text-white/60">
            {t("furretFooter.slogan")}
          </Meta>
        </div>
      </div>
    </footer>
  );
}
