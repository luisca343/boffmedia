"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type { FtCategory } from "../../_utils/article";
import { Button, ComicBurst, Field, Input, Modal, Textarea } from "../../_components/ui";

export interface NewArticleValues {
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  category: string;
  subcategory: string;
  buttonText: string;
  imageUrl: string;
}

const EMPTY: NewArticleValues = {
  title: "",
  subtitle: "",
  author: "",
  authorRole: "",
  category: "",
  subcategory: "",
  buttonText: "",
  imageUrl: "",
};

/** The draft-creation form. The body is filled in afterwards, in the editor. */
export function NewArticleModal({
  open,
  onClose,
  onCreate,
  categories,
  isSubmitting = false,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewArticleValues) => void;
  categories: FtCategory[];
  isSubmitting?: boolean;
}) {
  const t = useTranslations("furrettoday.newArticleModal");
  const [values, setValues] = useState<NewArticleValues>(EMPTY);

  // The component itself never unmounts (Modal just renders null while
  // closed), so the form has to be reset explicitly on every open.
  useEffect(() => {
    if (open) setValues({ ...EMPTY, buttonText: t("defaultButtonText") });
  }, [open, t]);

  function set<K extends keyof NewArticleValues>(key: K, value: NewArticleValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    onCreate(values);
  }

  return (
    <Modal open={open} onClose={onClose} label={t("label")}>
      <form onSubmit={handleSubmit} className="relative overflow-hidden p-6">
        <div className="font-ft-ui text-[11px] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
          {t("eyebrow")}
        </div>
        <h3 className="font-ft-display mt-1 text-4xl leading-none">{t("title")}</h3>
        <p className="mb-4 mt-1.5 text-ft-body">
          {t("description")}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("titleField")} full>
            <Input
              required
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t("titlePh")}
            />
          </Field>
          <Field label={t("lead")} full>
            <Textarea
              rows={2}
              value={values.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder={t("leadPh")}
            />
          </Field>
          <Field label={t("author")}>
            <Input
              value={values.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder={t("authorPh")}
            />
          </Field>
          <Field label={t("role")}>
            <Input
              value={values.authorRole}
              onChange={(e) => set("authorRole", e.target.value)}
              placeholder={t("rolePh")}
            />
          </Field>
          <Field label={t("section")}>
            <Input
              list="ft-new-article-categories"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder={t("sectionPh")}
            />
            <datalist id="ft-new-article-categories">
              {categories.map((c) => (
                <option key={c.id} value={c.label} />
              ))}
            </datalist>
          </Field>
          <Field label={t("subsection")}>
            <Input
              value={values.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder={t("subsectionPh")}
            />
          </Field>
          <Field label={t("buttonText")}>
            <Input value={values.buttonText} onChange={(e) => set("buttonText", e.target.value)} />
          </Field>
          <Field label={t("imageUrl")}>
            <Input
              value={values.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder={t("imageUrlPh")}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || !values.title.trim()}
          >
            {isSubmitting ? t("creating") : t("create")}
          </Button>
        </div>

        <ComicBurst
          size={130}
          text="NEW!"
          className="pointer-events-none absolute -right-8 -top-8 rotate-12"
        />
      </form>
    </Modal>
  );
}
