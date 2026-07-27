"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormat } from "@/lib/useFormat";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import type { News, UpdateNewsDto } from "@boffmedia/shared";

import { useBoffSession } from "@/services/useBoffSession";

import { furretKeys, useSaveArticle } from "../../_hooks/queries";
import type { FtArticle, FtCategory } from "../../_utils/article";
import {
  Button,
  CardFlat,
  EmptyState,
  Eyebrow,
  Field,
  Meta,
  MetaInput,
  Pill,
  toast,
} from "../../_components/ui";

const CustomEditor = dynamic(() => import("@/components/shared/ckeditor/TestEditor"), {
  ssr: false,
});

interface MetaForm {
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  category: string;
  subcategory: string;
  issue: string;
  buttonText: string;
  imageUrl: string;
}

function formFrom(article: FtArticle): MetaForm {
  return {
    title: article.title,
    // The RAW subtitle, never `deck`: `deck` falls back to the body's opening
    // sentence, so seeding the input with it would persist that fallback as a
    // real subtitle the moment anything else on this form is saved.
    subtitle: article.subtitle ?? "",
    author: article.author ?? "",
    authorRole: article.authorRole ?? "",
    category: article.category ?? "",
    subcategory: article.subcategory ?? "",
    issue: article.issue != null ? String(article.issue) : "",
    buttonText: article.buttonText ?? "",
    imageUrl: article.imageUrl ?? "",
  };
}

function statusOf(article: FtArticle) {
  if (article.featured) return { labelKey: "statusFeatured", tone: "pink" as const };
  if (article.published) return { labelKey: "statusPublished", tone: "lime" as const };
  return { labelKey: "statusDraft", tone: "yellow" as const };
}

export function EditorPane({
  article,
  categories,
  onRequestNew,
}: {
  article: FtArticle | null;
  categories: FtCategory[];
  onRequestNew: () => void;
}) {
  const t = useTranslations("furrettoday.editor");
  if (!article) {
    return (
      <EmptyState
        className="min-h-[420px]"
        title={t("emptyTitle")}
        message={t("emptyMessage")}
        actionLabel={t("emptyAction")}
        onAction={onRequestNew}
      />
    );
  }

  // Keyed by id so switching articles gives CKEditor (uncontrolled by design)
  // a clean remount instead of showing the previous article's body.
  return <EditorPaneContent key={article.id} article={article} categories={categories} />;
}

function EditorPaneContent({
  article,
  categories,
}: {
  article: FtArticle;
  categories: FtCategory[];
}) {
  const t = useTranslations("furrettoday");
  const { date } = useFormat();
  const { session } = useBoffSession();
  const token = session?.user?.accessToken ?? "";
  const client = useQueryClient();
  const saveArticle = useSaveArticle();

  const [form, setForm] = useState<MetaForm>(() => formFrom(article));
  const [baseline, setBaseline] = useState<MetaForm>(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const status = statusOf(article);

  function set<K extends keyof MetaForm>(key: K, value: MetaForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // CKEditor's own save button PUTs the body straight to the API and never
  // tells this component directly — it only calls back through these two
  // props. `updateNews` keeps the per-article cache in sync immediately;
  // `refresh` invalidates so the list (read time, deck preview) catches up.
  function handleBodyUpdate(newsId: number, content: string) {
    client.setQueryData<News>(furretKeys.article(newsId), (prev) =>
      prev ? { ...prev, content } : prev,
    );
  }

  function handleBodyRefresh() {
    void client.invalidateQueries({ queryKey: furretKeys.all() });
    void client.invalidateQueries({ queryKey: furretKeys.article(article.id) });
  }

  function handleSaveMeta() {
    const issue = Number.parseInt(form.issue, 10);
    // The body is CKEditor's to save — read whatever it last persisted (it
    // patches this cache entry on every save) rather than the possibly-stale
    // list snapshot, so a metadata save can never revert a fresher body.
    const cached = client.getQueryData<News>(furretKeys.article(article.id));
    const content = cached?.content ?? article.content;

    const title = form.title.trim() || t("editor.untitled");
    const data: UpdateNewsDto = {
      title,
      subtitle: form.subtitle.trim() || undefined,
      category: form.category.trim() || undefined,
      subcategory: form.subcategory.trim() || undefined,
      content,
      buttonText: form.buttonText.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      author: form.author.trim() || undefined,
      authorRole: form.authorRole.trim() || undefined,
      issue: Number.isFinite(issue) && issue > 0 ? issue : undefined,
    };

    saveArticle.mutate(
      { id: article.id, data },
      {
        onSuccess: () => {
          setBaseline(form);
          toast(t("editor.saveSuccess", { title }));
        },
        onError: () => toast.error(t("editor.saveError")),
      },
    );
  }

  const knownCategories = categories.map((c) => c.label);

  return (
    <CardFlat className="overflow-hidden">
      <div className="border-t-ft-hair border-b border-dashed border-ft-ink bg-ft-paper-2 p-5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <Eyebrow className="text-ft-pink">{t("editor.editing", { id: article.id })}</Eyebrow>
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill tone={status.tone}>{t(`editor.${status.labelKey}`)}</Pill>
            <Meta>{t("editor.updated", { date: date(article.updatedAt) })}</Meta>
            <Meta>{t("editor.readTimeLabel", { time: article.readTime })}</Meta>
            <Meta>👏 {article.claps}</Meta>
          </div>
        </div>

        <input
          aria-label={t("editor.titleAria")}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="font-ft-display w-full border-0 bg-transparent p-0 text-[clamp(32px,4vw,48px)] leading-none tracking-[0.02em] text-ft-ink outline-none"
        />
        <input
          aria-label={t("editor.leadAria")}
          value={form.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder={t("editor.leadPlaceholder")}
          className="font-ft-deck mt-2.5 w-full border-0 bg-transparent p-0 text-lg italic text-ft-deck outline-none placeholder:text-ft-deck/50"
        />

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Field label={t("editor.authorField")}>
            <MetaInput
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder={t("editor.bodyPlaceholder")}
            />
          </Field>
          <Field label={t("editor.roleField")}>
            <MetaInput
              value={form.authorRole}
              onChange={(e) => set("authorRole", e.target.value)}
              placeholder={t("editor.authorPlaceholder")}
            />
          </Field>
          <Field label={t("editor.sectionField")}>
            <MetaInput
              list="ft-editor-categories"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder={t("editor.tagsPlaceholder")}
            />
          </Field>
          <Field label={t("editor.subsectionField")}>
            <MetaInput
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder={t("editor.optionalPlaceholder")}
            />
          </Field>
          <Field label={t("editor.issueField")}>
            <MetaInput
              type="number"
              min={1}
              value={form.issue}
              onChange={(e) => set("issue", e.target.value)}
              placeholder={t("editor.issuePh")}
            />
          </Field>
          <Field label={t("editor.buttonTextField")}>
            <MetaInput
              value={form.buttonText}
              onChange={(e) => set("buttonText", e.target.value)}
              placeholder={t("editor.readMorePlaceholder")}
            />
          </Field>
          <Field label={t("editor.imageUrlField")} full>
            <MetaInput
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder={t("editor.imageUrlPh")}
            />
          </Field>
        </div>
        <datalist id="ft-editor-categories">
          {knownCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="px-5 pt-4">
        <Eyebrow className="text-ft-pink">
          {t("editor.bodyHint")}
        </Eyebrow>
      </div>

      <div
        className="ft-article rounded-ft border-ft-hair border-ft-ink mx-5 my-3 overflow-hidden
          [&_.ck-editor\_\_editable]:min-h-[460px] [&_.ck-editor\_\_editable]:bg-white
          [&_.ck-editor\_\_editable]:px-9 [&_.ck-editor\_\_editable]:py-8
          [&_.ck-editor\_\_editable]:text-[17px] [&_.ck-editor\_\_editable]:leading-[1.7]
          [&_.ck-editor\_\_editable]:border-0 [&_.ck-editor\_\_editable]:shadow-none
          [&_.ck-editor\_\_editable]:outline-none [&_.ck-editor\_\_top]:border-0
          [&_.ck-editor\_\_top]:border-b [&_.ck-editor\_\_top]:border-dashed
          [&_.ck-editor\_\_top]:border-ft-ink [&_.ck-toolbar]:border-0
          [&_.ck-toolbar]:px-3 [&_.ck-toolbar]:py-2 [&_.ck.ck-toolbar]:bg-ft-paper-2"
      >
        <CustomEditor
          document={article}
          documentId={article.id}
          documentType={1}
          token={token}
          updateNews={handleBodyUpdate}
          refresh={handleBodyRefresh}
        />
      </div>

      <div className="border-t-ft-hair flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-ft-ink bg-ft-paper-2 px-5 py-3.5">
        <Meta>{t("editor.footerNote")}</Meta>
        <div className="flex gap-2">
          <Link
            href={`/smartrotom/furrettoday/leer/${article.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-ft-ui border-ft inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ft-pill border-ft-ink bg-ft-yellow px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-ft-ink shadow-ft-pop-sm transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-ft-pop-md motion-reduce:transition-none"
          >
            {t("editor.preview")}
          </Link>
          <Button
            variant={dirty ? "primary" : "ghost"}
            size="sm"
            onClick={handleSaveMeta}
            disabled={!dirty || saveArticle.isPending}
          >
            {saveArticle.isPending
              ? t("editor.saving")
              : dirty
                ? t("editor.saveChanges")
                : t("editor.noChanges")}
          </Button>
        </div>
      </div>
    </CardFlat>
  );
}
