import { useTranslations } from "next-intl";

import type { FtArticle } from "../../_utils/article";
import { Meta, Pill, Toggle } from "../../_components/ui";

/** Status pill tone/label, derived from the two real flags — never a third state. */
function statusOf(article: FtArticle) {
  if (article.featured) return { labelKey: "featured", tone: "pink" as const };
  if (article.published) return { labelKey: "published", tone: "lime" as const };
  return { labelKey: "draft", tone: "yellow" as const };
}

export function NewsRow({
  article,
  active,
  onSelect,
  onTogglePublished,
  onToggleFeatured,
  onRequestDelete,
  busy = false,
}: {
  article: FtArticle;
  active: boolean;
  onSelect: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
  onRequestDelete: () => void;
  busy?: boolean;
}) {
  const t = useTranslations("furrettoday.newsRow");
  const status = statusOf(article);

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={[
          "rounded-ft-md cursor-pointer p-3.5 transition-transform duration-150",
          active
            ? "border-ft-thick border-ft-ink bg-ft-yellow shadow-ft-pop -translate-x-px -translate-y-px"
            : "border border-ft-ink/15 bg-white hover:bg-ft-yellow/10",
        ].join(" ")}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <Pill tone={status.tone}>{t(status.labelKey)}</Pill>
          <Meta className="text-[11px] text-ft-ink/70">{article.datelineShort}</Meta>
        </div>

        <h4 className="font-ft-display line-clamp-2 text-lg leading-[1.05] text-ft-ink">
          {article.title}
        </h4>

        <Meta className="mt-1 text-[11px] text-ft-ink/70">
          {article.author ? `${article.author} · ` : ""}
          {article.readTime}
        </Meta>

        <div
          className="mt-2.5 flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Toggle
            checked={article.published}
            label={t("togglePublished")}
            tone="cyan"
            onChange={onTogglePublished}
            disabled={busy}
          />
          <Toggle
            checked={article.featured}
            label={t("toggleFeatured")}
            tone="pink"
            onChange={onToggleFeatured}
            disabled={busy}
          />
          <button
            type="button"
            onClick={onRequestDelete}
            aria-label={t("deleteAria", { title: article.title })}
            className="font-ft-ui ml-auto rounded-ft-pill border border-ft-ink/30 px-2.5 py-1 text-[11px] font-bold text-ft-ink hover:border-ft-ink hover:bg-ft-ink/5"
          >
            🗑
          </button>
        </div>
      </div>
    </li>
  );
}
