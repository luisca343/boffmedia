"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  useDeleteArticle,
  useNewsroom,
  useSaveArticle,
  useUpdateNewsStatus,
} from "../../_hooks/queries";
import { categoriesOf, matchesQuery, type FtArticle } from "../../_utils/article";
import { Button, Eyebrow, Modal, Skeleton, toast } from "../../_components/ui";
import { EditorPane } from "./EditorPane";
import { NewArticleModal, type NewArticleValues } from "./NewArticleModal";
import { NewsroomHeader } from "./NewsroomHeader";
import { NewsSidebar, type StatusFilter } from "./NewsSidebar";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

/**
 * The status endpoint takes the whole resulting state in one call (every
 * published id + the single featured id) and requires a real, positive
 * featured id — there is no way to persist "nothing featured" through it.
 * So any change that would leave zero featured articles is refused
 * client-side rather than sent, with a toast explaining why.
 */
function requireFeatured(featured: number | null, message: string): featured is number {
  if (featured == null) {
    toast.error(message);
    return false;
  }
  return true;
}

export function Newsroom({ initialId = null }: { initialId?: number | null }) {
  const t = useTranslations("furrettoday");
  const { articles, isLoading } = useNewsroom();
  const saveArticle = useSaveArticle();
  const deleteArticle = useDeleteArticle();
  const updateStatus = useUpdateNewsStatus();

  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const sorted = useMemo(
    () =>
      [...articles].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.id - a.id;
      }),
    [articles],
  );

  // Deep link named an id; otherwise default to the first row once loaded.
  useEffect(() => {
    if (selectedId == null && sorted.length > 0) {
      setSelectedId(sorted[0].id);
    }
  }, [sorted, selectedId]);

  const filtered = useMemo(
    () =>
      sorted.filter((a) => {
        if (!matchesQuery(a, search)) return false;
        if (statusFilter === "all") return true;
        if (statusFilter === "featured") return a.featured;
        if (statusFilter === "published") return a.published && !a.featured;
        return !a.published; // draft
      }),
    [sorted, search, statusFilter],
  );

  const selected = sorted.find((a) => a.id === selectedId) ?? null;
  const categories = useMemo(() => categoriesOf(articles), [articles]);

  const counts = {
    total: articles.length,
    published: articles.filter((a) => a.published).length,
    featured: articles.filter((a) => a.featured).length,
    drafts: articles.filter((a) => !a.published).length,
  };

  function onTogglePublished(article: FtArticle) {
    const featuredId = articles.find((a) => a.featured)?.id ?? null;
    const publishedIds = articles.filter((a) => a.published).map((a) => a.id);

    const nextPublished = article.published
      ? publishedIds.filter((id) => id !== article.id)
      : [...publishedIds, article.id];
    const nextFeatured = article.published
      ? featuredId === article.id
        ? null
        : featuredId
      : (featuredId ?? article.id);

    if (!requireFeatured(nextFeatured, t("newsroom.chooseFeatureFirst"))) return;
    updateStatus.mutate(
      { published: nextPublished, featured: nextFeatured },
      {
        onSuccess: () =>
          toast(article.published ? t("newsroom.unpublishSuccess") : t("newsroom.publishSuccess")),
        onError: () => toast.error(t("newsroom.updateStatusError")),
      },
    );
  }

  function onToggleFeatured(article: FtArticle) {
    const featuredId = articles.find((a) => a.featured)?.id ?? null;
    const publishedIds = articles.filter((a) => a.published).map((a) => a.id);

    const nextFeatured = featuredId === article.id ? null : article.id;
    if (!requireFeatured(nextFeatured, t("newsroom.chooseFeatureFirst"))) return;
    const nextPublished = publishedIds.includes(nextFeatured)
      ? publishedIds
      : [...publishedIds, nextFeatured];

    updateStatus.mutate(
      { published: nextPublished, featured: nextFeatured },
      {
        onSuccess: () => toast(t("newsroom.setCoverSuccess")),
        onError: () => toast.error(t("newsroom.updateStatusError")),
      },
    );
  }

  function confirmDelete() {
    if (pendingDeleteId == null) return;
    const id = pendingDeleteId;
    deleteArticle.mutate(id, {
      onSuccess: () => {
        toast(t("newsroom.deleteSuccess"));
        if (selectedId === id) {
          const remaining = sorted.filter((a) => a.id !== id);
          setSelectedId(remaining[0]?.id ?? null);
        }
      },
      onError: () => toast.error(t("newsroom.deleteError")),
    });
    setPendingDeleteId(null);
  }

  function onCreateDraft(values: NewArticleValues) {
    const title = values.title.trim() || t("newsroom.untitledDraft");
    saveArticle.mutate(
      {
        id: null,
        data: {
          title,
          subtitle: values.subtitle.trim() || undefined,
          category: values.category.trim() || undefined,
          subcategory: values.subcategory.trim() || undefined,
          content: `<h1>${escapeHtml(title)}</h1><p>${t("newsroom.draftBody")}</p>`,
          buttonText: values.buttonText.trim() || undefined,
          imageUrl: values.imageUrl.trim() || undefined,
          author: values.author.trim() || undefined,
          authorRole: values.authorRole.trim() || undefined,
        },
      },
      {
        onSuccess: (saved) => {
          setSelectedId(saved.id);
          setNewOpen(false);
          toast(t("newsroom.draftCreated"));
        },
        onError: () => toast.error(t("newsroom.draftError")),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <Skeleton className="h-[220px] w-full" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
          <Skeleton className="h-[560px] w-full" />
          <Skeleton className="h-[560px] w-full" />
        </div>
      </div>
    );
  }

  const pendingArticle = sorted.find((a) => a.id === pendingDeleteId) ?? null;

  return (
    <div>
      <NewsroomHeader {...counts} />

      <main className="mx-auto max-w-[1400px] px-6 pb-12 pt-6">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
          <NewsSidebar
            total={articles.length}
            articles={filtered}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNew={() => setNewOpen(true)}
            onTogglePublished={onTogglePublished}
            onToggleFeatured={onToggleFeatured}
            onRequestDelete={setPendingDeleteId}
            statusPending={updateStatus.isPending}
          />

          <EditorPane
            article={selected}
            categories={categories}
            onRequestNew={() => setNewOpen(true)}
          />
        </div>
      </main>

      <NewArticleModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={onCreateDraft}
        categories={categories}
        isSubmitting={saveArticle.isPending}
      />

      <Modal
        open={pendingDeleteId != null}
        onClose={() => setPendingDeleteId(null)}
        label={t("newsroom.deleteLabel")}
      >
        <div className="p-6">
          <Eyebrow className="text-ft-pink">{t("newsroom.deleteEyebrow")}</Eyebrow>
          <h3 className="font-ft-display mt-1 text-3xl">{t("newsroom.deleteTitle")}</h3>
          <p className="mt-2 text-ft-body">
            {t("newsroom.deleteMessage", {
              title: pendingArticle?.title ?? t("newsroom.deleteFallbackTitle"),
            })}
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setPendingDeleteId(null)}>
              {t("newsroom.cancel")}
            </Button>
            <Button variant="primary" onClick={confirmDelete} disabled={deleteArticle.isPending}>
              {deleteArticle.isPending ? t("newsroom.deleting") : t("newsroom.confirmDeleteAction")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
