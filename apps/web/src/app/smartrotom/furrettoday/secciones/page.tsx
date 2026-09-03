"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ArticleCard } from "../_components/ArticleCard";
import { useNewsroom } from "../_hooks/queries";
import { categoriesOf, matchesQuery, type FtArticle } from "../_utils/article";
import {
  Chip,
  EmptyState,
  Eyebrow,
  Select,
  Skeleton,
} from "../_components/ui";
import { BrowseHero } from "./_components/BrowseHero";
import { EditorialBoard } from "./_components/EditorialBoard";
import { IssueArchive } from "./_components/IssueArchive";

type SortKey = "recent" | "claps" | "issue";

/**
 * Mirrors a query-string param into local state so the search box feels
 * instant while typing, then pushes the value into the URL with `replace`
 * (no history spam). A `?cat=` set from the masthead's chips — which never
 * remounts this route — is picked up by the effect below.
 */
function useUrlParam(key: string, fallback: string) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlValue = searchParams.get(key) ?? fallback;
  const [value, setLocalValue] = useState(urlValue);

  useEffect(() => {
    setLocalValue(urlValue);
  }, [urlValue]);

  const setValue = useCallback(
    (next: string) => {
      setLocalValue(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next && next !== fallback) params.set(key, next);
      else params.delete(key);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router, key, fallback],
  );

  return [value, setValue] as const;
}

function sortArticles(articles: FtArticle[], sort: SortKey): FtArticle[] {
  const list = [...articles];
  if (sort === "claps") return list.sort((a, b) => b.claps - a.claps);
  if (sort === "issue")
    return list.sort((a, b) => (b.issue ?? -1) - (a.issue ?? -1));
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function BrowseScreen() {
  const t = useTranslations("furrettoday.browse");
  const [query, setQuery] = useUrlParam("q", "");
  const [activeCategory, setActiveCategory] = useUrlParam("cat", "all");
  const [sort, setSort] = useState<SortKey>("recent");
  const { articles, isLoading } = useNewsroom();

  const browsable = useMemo(
    () => articles.filter((a) => a.published),
    [articles],
  );

  const categories = useMemo(() => categoriesOf(browsable), [browsable]);

  const filtered = useMemo(() => {
    const list = browsable.filter((a) => {
      const inCategory =
        activeCategory === "all" ||
        a.category?.toLowerCase() === activeCategory.toLowerCase();
      return inCategory && matchesQuery(a, query);
    });
    return sortArticles(list, sort);
  }, [browsable, activeCategory, query, sort]);

  const tagCloud = useMemo(() => {
    const set = new Set<string>();
    for (const c of categories) set.add(c.label);
    for (const a of browsable) for (const t of a.tags) set.add(t);
    return [...set];
  }, [categories, browsable]);

  const catLabel =
    activeCategory === "all"
      ? t("allSections")
      : (categories.find(
          (c) => c.label.toLowerCase() === activeCategory.toLowerCase(),
        )?.label ?? activeCategory);

  function resetFilters() {
    setQuery("");
    setActiveCategory("all");
  }

  function onTagClick(tag: string) {
    const match = categories.find(
      (c) => c.label.toLowerCase() === tag.toLowerCase(),
    );
    if (match) {
      setActiveCategory(match.label);
      setQuery("");
    } else {
      setActiveCategory("all");
      setQuery(tag);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[87.5rem] px-6 py-14">
        <Skeleton className="h-14 w-2/3" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrowseHero
        query={query}
        onQueryChange={setQuery}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        totalCount={browsable.length}
      />

      <section className="mx-auto max-w-[87.5rem] px-6 pb-4 pt-10">
        <div className="border-ft flex flex-wrap items-end justify-between gap-4 border-x-0 border-t-0 border-b-ft-ink pb-3">
          <div>
            <Eyebrow className="text-ft-pink">{t("resultsEyebrow")}</Eyebrow>
            <h2 className="font-ft-display mt-1 text-[clamp(2.25rem,5vw,3.5rem)] leading-none">
              {t("resultsCount", { count: filtered.length, category: catLabel })}
            </h2>
          </div>
          <label className="flex items-center gap-2">
            <span className="font-ft-ui text-[0.8125rem] font-medium uppercase tracking-[0.04em] text-ft-ink/70">
              {t("sort")}
            </span>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label={t("sortAria")}
              className="w-auto"
            >
              <option value="recent">{t("sortRecent")}</option>
              <option value="claps">{t("sortClaps")}</option>
              <option value="issue">{t("sortIssue")}</option>
            </Select>
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-[87.5rem] px-6 pb-8 pt-2">
        {filtered.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            message={t("emptyMessage")}
            actionLabel={t("resetSearch")}
            onAction={resetFilters}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>

      {tagCloud.length > 0 ? (
        <section className="mx-auto max-w-[87.5rem] px-6 pb-12">
          <Eyebrow className="mb-3.5 text-ft-pink">
            {t("tagsEyebrow")}
          </Eyebrow>
          <div className="flex flex-wrap gap-2.5">
            {tagCloud.map((tag, i) => (
              <Chip
                key={tag}
                style={{
                  fontSize: 12 + (i % 5) * 2,
                  transform: `rotate(${(i % 5) - 2}deg)`,
                }}
                onClick={() => onTagClick(tag)}
              >
                #{tag}
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      <EditorialBoard />
      <IssueArchive />
    </div>
  );
}

/**
 * `useSearchParams` opts its subtree into Suspense at build time — without
 * this boundary `next build` fails even though the route is fully
 * client-rendered.
 */
export default function SeccionesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[87.5rem] px-6 py-14">
          <Skeleton className="h-14 w-2/3" />
        </div>
      }
    >
      <BrowseScreen />
    </Suspense>
  );
}
