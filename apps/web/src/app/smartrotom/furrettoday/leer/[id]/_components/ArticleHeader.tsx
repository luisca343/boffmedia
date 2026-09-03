import { useLocale } from "next-intl";

import { Avatar, Meta, Pill, Tag } from "../../../_components/ui";
import { ACCENT_HEX } from "../../../_utils/accents";
import { longDateOf, type FtArticle } from "../../../_utils/article";

/**
 * The title block. `author`/`authorRole` are nullable on every pre-existing
 * row (migration 0025 added them after the fact), so the byline row is gated
 * as a whole — an article without one still prints its tags, never a
 * placeholder name.
 */
export function ArticleHeader({ article }: { article: FtArticle }) {
  const locale = useLocale();
  return (
    <header className="border-ft relative overflow-hidden border-x-0 border-t-0 border-b-ft-ink bg-ft-paper">
      <div className="ft-halftone absolute inset-0 opacity-10" aria-hidden="true" />
      <div className="relative mx-auto max-w-[55rem] px-6 py-12">
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <Pill tone={article.accent}>{article.eyebrow}</Pill>
          <Meta>{longDateOf(article.createdAt, locale)}</Meta>
          <Meta>·</Meta>
          <Meta>{article.readTime}</Meta>
        </div>

        <h1
          className="font-ft-display mb-4 pb-2 text-[clamp(3rem,7.2vw,6rem)] leading-[0.96]"
          style={{ textShadow: `5px 5px 0 ${ACCENT_HEX.pink}` }}
        >
          {article.title}
        </h1>

        {article.deck ? (
          <p className="font-ft-deck max-w-[47.5rem] text-[clamp(1.25rem,2.2vw,1.625rem)] italic text-ft-deck">
            {article.deck}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3.5">
          {article.author ? (
            <>
              <Avatar name={article.author} size={56} />
              <div>
                <div className="font-ft-deck text-lg italic">
                  {article.author}
                </div>
                {article.authorRole ? (
                  <Meta className="block">{article.authorRole}</Meta>
                ) : null}
              </div>
            </>
          ) : null}

          {article.tags.length > 0 ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {article.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
