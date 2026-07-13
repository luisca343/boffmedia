"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import type { FtArticle } from "../../_utils/article";
import { articleHref } from "../ArticleCard";
import {
  Button,
  ComicBurst,
  Eyebrow,
  FurretMascot,
  Meta,
  Pill,
  SpeechBubble,
  Sticker,
} from "../ui";

/**
 * `cover.issue` is nullable on every pre-existing row — there is no season
 * field at all, so a real issue number stands alone rather than pairing with
 * an invented season string.
 */
function issueLabel(cover: FtArticle): string {
  return cover.issue ? `Nº ${cover.issue}` : cover.eyebrow;
}

export function CoverHero({
  cover,
  contents,
}: {
  cover: FtArticle;
  /** Up to four other published articles, for the "EN ESTE NÚMERO" strip. */
  contents: FtArticle[];
}) {
  const router = useRouter();
  const words = cover.title.split(" ");

  return (
    <section className="ft-cover-ink border-ft relative overflow-hidden border-x-0 border-t-0 border-b-ft-ink">
      <div
        aria-hidden="true"
        className="ft-halftone-light ft-halftone-mask pointer-events-none absolute inset-0 opacity-[0.18]"
      />

      <div className="ft-wrap-wide relative flex flex-wrap items-baseline justify-between gap-4 px-6 pt-10">
        <Eyebrow className="text-ft-yellow">{issueLabel(cover)}</Eyebrow>
        <Meta className="text-white/70">{cover.dateline}</Meta>
      </div>

      <div className="ft-wrap-wide relative grid items-center gap-14 px-6 pb-14 pt-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative min-w-0">
          <Pill tone="pink" className="mb-[18px]">
            {cover.eyebrow}
          </Pill>

          <h1
            className="font-ft-display break-words leading-[0.86] tracking-[0.005em] text-ft-yellow"
            style={{ fontSize: "clamp(4rem, 9.5vw, 8.875rem)", margin: "12px 0" }}
          >
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: 18,
                  transform: i === 1 ? "rotate(-2deg)" : undefined,
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            className="font-ft-deck mb-6 max-w-[640px] italic text-white/85"
            style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)" }}
          >
            {cover.deck}
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(articleHref(cover.id))}
            >
              LEER LA PORTADA →
            </Button>
            <Meta className="text-white/75">
              {cover.author ? `${cover.author} · ` : ""}
              {cover.readTime}
            </Meta>
          </div>
        </div>

        <div className="relative min-h-[460px] min-w-0 overflow-visible">
          <div className="border-ft-thick absolute right-[8%] top-[10%] h-[360px] w-[360px] rounded-full border-ft-ink bg-ft-yellow shadow-ft-pop-lg" />

          <div
            aria-hidden="true"
            className="ft-halftone-mask absolute -right-[4%] top-[32%] h-[220px] w-[460px] opacity-[0.85]"
            style={{
              backgroundImage: "radial-gradient(#0b0b0f 2px, transparent 2.4px)",
              backgroundSize: "14px 14px",
              transform: "rotate(-8deg)",
            }}
          />

          <FurretMascot
            size={420}
            className="absolute bottom-0 left-0"
            style={{
              transform: "rotate(-6deg)",
              filter: "drop-shadow(8px 8px 0 #0b0b0f)",
            }}
          />

          <Sticker
            bob
            className="text-[22px]"
            style={{ position: "absolute", right: 36, top: 36 }}
          >
            NUEVO
          </Sticker>

          <SpeechBubble
            style={{ position: "absolute", right: 12, bottom: "6%", maxWidth: 220 }}
          >
            <span className="font-ft-display block text-[26px] leading-[0.9] text-ft-ink">
              CA·MI·NAR
            </span>
          </SpeechBubble>

          <ComicBurst
            size={110}
            color="rgb(var(--ft-cyan))"
            style={{
              position: "absolute",
              right: -10,
              bottom: "32%",
              transform: "rotate(-14deg)",
              zIndex: 2,
            }}
            text="POW!"
          />
        </div>
      </div>

      {contents.length > 0 ? (
        <div className="border-ft relative border-x-0 border-b-0 border-ft-ink bg-white/[0.06]">
          <div className="ft-wrap-wide grid grid-cols-1 gap-4 px-6 py-[18px] sm:grid-cols-[auto_repeat(4,1fr)] sm:items-center">
            <Eyebrow className="text-ft-yellow">EN ESTE NÚMERO</Eyebrow>
            {contents.map((article) => (
              <Link
                key={article.id}
                href={articleHref(article.id)}
                className="flex min-w-0 items-baseline gap-2 hover:opacity-80"
              >
                <span className="font-ft-display shrink-0 text-[22px] text-ft-pink">
                  {article.datelineShort}
                </span>
                <span className="font-ft-ui truncate text-[13px] font-medium uppercase tracking-[0.04em] text-white/85">
                  {article.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
