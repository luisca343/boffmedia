"use client";

import { useTranslations } from "next-intl";

import type { FtArticle } from "../../_utils/article";
import { Button, CardFlat, Chip, FurretMascot, Input, Meta } from "../../_components/ui";
import { NewsRow } from "./NewsRow";

export type StatusFilter = "all" | "featured" | "published" | "draft";

const FILTERS: { id: StatusFilter; labelKey: string }[] = [
  { id: "all", labelKey: "filterAll" },
  { id: "featured", labelKey: "filterFeatured" },
  { id: "published", labelKey: "filterPublished" },
  { id: "draft", labelKey: "filterDraft" },
];

/** The sticky list rail. `articles` is already filtered/sorted by the caller. */
export function NewsSidebar({
  total,
  articles,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedId,
  onSelect,
  onNew,
  onTogglePublished,
  onToggleFeatured,
  onRequestDelete,
  statusPending = false,
}: {
  total: number;
  articles: FtArticle[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onTogglePublished: (article: FtArticle) => void;
  onToggleFeatured: (article: FtArticle) => void;
  onRequestDelete: (id: number) => void;
  statusPending?: boolean;
}) {
  const t = useTranslations("furrettoday.newsSidebar");
  return (
    <CardFlat className="sticky top-[6.875rem] flex max-h-[calc(100vh-8.75rem)] flex-col overflow-hidden">
      <div className="border-ft border-x-0 border-t-0 border-b-ft-ink bg-ft-pink p-4 text-white">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-ft-ui text-[0.6875rem] font-extrabold uppercase tracking-[0.18em] text-ft-yellow">
            {t("title")}
          </span>
          <Meta className="text-white/85">
            {articles.length}/{total}
          </Meta>
        </div>
        <Button variant="ink" size="lg" className="w-full justify-center" onClick={onNew}>
          {t("new")}
        </Button>
      </div>

      <div className="border-t-ft-hair border-dashed border-ft-ink p-3.5">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPh")}
          aria-label={t("searchAria")}
          className="w-full"
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              active={statusFilter === f.id}
              onClick={() => onStatusFilterChange(f.id)}
            >
              {t(f.labelKey)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="ft-scroll flex-grow overflow-y-auto">
        {articles.length === 0 ? (
          <div className="p-6 text-center">
            <FurretMascot size={80} className="mx-auto" />
            <div className="font-ft-display mt-1.5 text-xl">{t("emptyTitle")}</div>
            <p className="text-sm">{t("emptyMessage")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 p-2">
            {articles.map((a) => (
              <NewsRow
                key={a.id}
                article={a}
                active={a.id === selectedId}
                onSelect={() => onSelect(a.id)}
                onTogglePublished={() => onTogglePublished(a)}
                onToggleFeatured={() => onToggleFeatured(a)}
                onRequestDelete={() => onRequestDelete(a.id)}
                busy={statusPending}
              />
            ))}
          </ul>
        )}
      </div>
    </CardFlat>
  );
}
