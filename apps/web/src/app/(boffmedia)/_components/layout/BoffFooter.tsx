"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BoffButton as Button } from "@/components/boffmedia-v2/primitives/button";
import { Icon } from "@/components/boffmedia-v2/primitives/icon";

export function BoffFooter() {
  const t = useTranslations("boffmedia.footer");

  return (
    <footer
      className="mt-auto"
      style={{
        borderTop: "var(--hairline) solid var(--border)",
        background: "var(--layer-1)",
      }}
    >
      <div className="container mx-auto px-4">
        {/* Top: brand + link columns */}
        <div
          className="grid gap-14 py-16 max-[920px]:grid-cols-1 max-[920px]:gap-10"
          style={{ gridTemplateColumns: "1.1fr 2fr" }}
        >
          {/* Brand */}
          <div className="flex flex-col gap-[1.1rem] max-w-[30ch]">
            <Link href="/" className="inline-flex items-center gap-[0.6rem]">
              <img
                src="/img/boff-logo.webp"
                alt=""
                width={34}
                height={34}
                className="rounded-[6px]"
              />
              <span className="relative font-display font-extrabold text-[1.3rem] tracking-[0.01em] text-[var(--orange-500)] pr-[2.6rem]">
                BoffMedia
                <span className="absolute -top-[0.4rem] right-0 font-mono text-[0.5rem] font-bold tracking-[0.1em] px-[0.3rem] py-[0.12rem] text-[var(--on-secondary)] bg-secondary-hover rounded-[3px]">
                  BETA
                </span>
              </span>
            </Link>
            <p className="text-[length:var(--t-sm)] leading-[1.65] text-ink-muted m-0">
              {t("tagline")}
            </p>
            <div className="flex gap-[0.6rem]">
              {[
                { icon: "discord", label: "Discord" },
                { icon: "globe", label: "Web" },
                { icon: "message", label: "Foro" },
                { icon: "star", label: "Reseñas" },
              ].map(({ icon, label }) => (
                <Link
                  key={icon}
                  href="#"
                  aria-label={label}
                  className="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius)] border border-edge-strong text-ink-muted hover:text-[var(--orange-500)] hover:border-[var(--orange-500)] transition-colors duration-[var(--dur)]"
                >
                  <Icon name={icon} size={16} />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div
            className="grid gap-8 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1"
            style={{ gridTemplateColumns: "repeat(3, 1fr) 1.4fr" }}
          >
            {/* Plataforma */}
            <div>
              <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[0.1em] text-ink m-0 mb-[1.1rem]">
                {t("sections.platform.title")}
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.7rem]">
                {[
                  { href: "/herramientas", label: t("sections.platform.links.games") },
                  { href: "/eventos", label: t("sections.platform.links.events") },
                  { href: "/herramientas", label: t("sections.platform.links.tools") },
                  { href: "/community", label: t("sections.platform.links.community") },
                  { href: "/eventos", label: t("sections.platform.links.ranking") },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[length:var(--t-sm)] text-ink-muted transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[0.1em] text-ink m-0 mb-[1.1rem]">
                {t("sections.resources.title")}
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.7rem]">
                {[
                  { href: "/blog", label: t("sections.resources.links.blog") },
                  { href: "/styles/showcase", label: t("sections.resources.links.components") },
                  { href: "#", label: t("sections.resources.links.servers") },
                  { href: "#", label: t("sections.resources.links.status") },
                  { href: "#", label: t("sections.resources.links.api") },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[length:var(--t-sm)] text-ink-muted transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compañía */}
            <div>
              <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[0.1em] text-ink m-0 mb-[1.1rem]">
                {t("sections.company.title")}
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.7rem]">
                {[
                  { href: "/about", label: t("sections.company.links.about") },
                  { href: "#", label: t("sections.company.links.contact") },
                  { href: "#", label: t("sections.company.links.press") },
                  { href: "#", label: t("sections.company.links.discord") },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[length:var(--t-sm)] text-ink-muted transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[0.1em] text-ink m-0 mb-[1.1rem]">
                {t("newsletter.title")}
              </h4>
              <p className="text-ink-muted text-[length:var(--t-sm)] mt-0 mb-0">
                {t("newsletter.description")}
              </p>
              <form
                className="flex gap-[0.5rem] mt-[0.9rem]"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  className="flex-1 h-[46px] px-4 rounded-[var(--btn-radius,var(--radius-pill,9999px))] text-[length:var(--t-sm)] bg-layer-2 border border-edge-strong text-ink outline-none focus:border-secondary"
                  type="email"
                  placeholder={t("newsletter.emailPlaceholder")}
                  aria-label="Correo"
                />
                <Button
                  type="submit"
                  aria-label="Suscribirse"
                  className="px-3"
                >
                  {t("newsletter.joinButton")}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Legal bar */}
        <div
          className="flex items-center justify-between gap-4 py-[1.4rem] max-[560px]:flex-col max-[560px]:items-start"
          style={{
            borderTop: "var(--hairline) solid var(--border)",
          }}
        >
          <span className="text-[length:var(--t-sm)] text-ink-dim">
            {t("copyright", { year: new Date().getFullYear() })}
          </span>
          <div className="flex gap-6">
            {[
              { href: "/privacidad", label: t("legal.privacy") },
              { href: "/terminos", label: t("legal.terms") },
              { href: "/cookies", label: t("legal.cookies") },
            ].map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-[length:var(--t-sm)] text-ink-muted transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
