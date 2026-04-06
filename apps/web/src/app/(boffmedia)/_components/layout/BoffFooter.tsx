import Link from "next/link";
import { Button, Input, Container, Grid } from "@/components/ui";
import { Gamepad2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function BoffFooter() {
  const t = await getTranslations("boffmedia.footer");

  return (
    <footer className="relative bg-surface-950 overflow-hidden">
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
        }}
      />

      {/* Neon top border */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.4) 25%, rgba(251,146,60,0.65) 50%, rgba(249,115,22,0.4) 75%, transparent 100%)",
          boxShadow: "0 0 12px rgba(249,115,22,0.2)",
        }}
      />

      <Container size="lg" className="pt-14 pb-8 relative z-10">
        <Grid cols={1} colsMd={4} gap={10} className="mb-12">

          {/* ── Brand ── */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Gamepad2
                className="h-5 w-5 text-primary-500 flex-shrink-0"
                style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.45))" }}
              />
              <span
                className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-600 text-transparent bg-clip-text"
                style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,0.3))" }}
              >
                BoffMedia
              </span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* ── Platform links ── */}
          <div className="space-y-4">
            <h4
              className="text-xs font-mono text-primary-400/55 tracking-[0.35em] uppercase"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              // {t("sections.platform.title")}
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/juegos", label: t("sections.platform.links.games") },
                { href: "/eventos", label: t("sections.platform.links.events") },
                { href: "/community", label: t("sections.platform.links.community") },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-100 transition-colors duration-150 group"
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-150"
                      style={{ backgroundColor: "rgba(249,115,22,0.35)" }}
                      aria-hidden="true"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Company links ── */}
          <div className="space-y-4">
            <h4
              className="text-xs font-mono text-primary-400/55 tracking-[0.35em] uppercase"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              // {t("sections.company.title")}
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/about", label: t("sections.company.links.about") },
                { href: "/blog", label: t("sections.company.links.blog") },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-100 transition-colors duration-150"
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "rgba(249,115,22,0.35)" }}
                      aria-hidden="true"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Newsletter ── */}
          <div className="space-y-4">
            <h4
              className="text-xs font-mono text-primary-400/55 tracking-[0.35em] uppercase"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              // {t("newsletter.title")}
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder={t("newsletter.emailPlaceholder")}
                type="email"
                className="bg-surface-900 border-surface-700/60 text-surface-200 placeholder:text-surface-600 focus:border-primary-500/50 text-sm h-9"
              />
              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-500 text-white font-mono text-xs tracking-wider flex-shrink-0 h-9 px-3 transition-colors duration-150"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {t("newsletter.joinButton")}
              </Button>
            </div>
          </div>
        </Grid>

        {/* Gradient divider */}
        <div
          className="h-px mb-8"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(249,115,22,0.15) 30%, rgba(249,115,22,0.15) 70%, transparent)",
          }}
        />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p
            className="text-xs font-mono text-surface-600 tracking-wide"
          >
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacidad"
              className="text-xs font-mono text-surface-500 hover:text-primary-400 transition-colors duration-150 tracking-wide"
            >
              {t("legal.privacy")}
            </Link>
            <span className="w-px h-3 bg-surface-700/60" aria-hidden="true" />
            <Link
              href="/terminos"
              className="text-xs font-mono text-surface-500 hover:text-primary-400 transition-colors duration-150 tracking-wide"
            >
              {t("legal.terms")}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
