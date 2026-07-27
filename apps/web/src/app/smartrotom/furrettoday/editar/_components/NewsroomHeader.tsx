import { useTranslations } from "next-intl";

import { Eyebrow, Stat } from "../../_components/ui";

/**
 * The dark cover strip for the newsroom. Counts are real, computed by the
 * caller from the actual article list — nothing here is hardcoded.
 */
export function NewsroomHeader({
  total,
  published,
  featured,
  drafts,
}: {
  total: number;
  published: number;
  featured: number;
  drafts: number;
}) {
  const t = useTranslations("furrettoday.newsroomHeader");
  return (
    <section className="border-ft relative overflow-hidden border-x-0 border-t-0 border-b-ft-ink bg-ft-paper-dark text-white">
      <div
        aria-hidden="true"
        className="ft-halftone-light pointer-events-none absolute inset-0 opacity-20"
      />
      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-6 px-6 pb-7 pt-9 md:grid-cols-[1fr_auto]">
        <div>
          <Eyebrow className="text-ft-yellow">{t("eyebrow")}</Eyebrow>
          <h1
            className="font-ft-display mt-1.5 text-[clamp(48px,6vw,80px)] leading-[0.95] text-ft-yellow"
            style={{ textShadow: "5px 5px 0 #ff2d87" }}
          >
            {t("title")}
          </h1>
          <p className="font-ft-deck mt-3 max-w-[720px] text-xl italic text-white/85">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Stat label={t("total")} value={total} tone="cyan" />
          <Stat label={t("published")} value={published} tone="lime" />
          <Stat label={t("featured")} value={featured} tone="pink" />
          <Stat label={t("drafts")} value={drafts} tone="yellow" />
        </div>
      </div>
    </section>
  );
}
