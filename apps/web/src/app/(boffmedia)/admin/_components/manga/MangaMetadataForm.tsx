"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input, Select } from "@/components/boffmedia/primitives";
import { useMangaStore, type EpubMetadata } from "@/stores/useMangaStore";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
  { value: "ko", label: "한국어" },
];

function autoSort(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts.pop()!;
  return `${last}, ${parts.join(" ")}`;
}

interface Props {
  seriesSlug: string;
}

export default function MangaMetadataForm({ seriesSlug }: Props) {
  const t = useTranslations("admin.manga.metadata");
  const seriesMetadata = useMangaStore((s) => s.seriesMetadata);
  const setSeriesMetadata = useMangaStore((s) => s.setSeriesMetadata);

  const stored = seriesMetadata[seriesSlug] ?? {};

  const [form, setForm] = useState<EpubMetadata>({
    title: stored.title ?? seriesSlug,
    language: stored.language ?? "en",
    author: stored.author ?? "",
    authorSort: stored.authorSort ?? "",
    illustrator: stored.illustrator ?? "",
    illustratorSort: stored.illustratorSort ?? "",
    publisher: stored.publisher ?? "",
    date: stored.date ?? "",
    subjects: stored.subjects ?? [],
  });
  const [subjectsText, setSubjectsText] = useState((stored.subjects ?? []).join(", "));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = seriesMetadata[seriesSlug] ?? {};
    setForm({
      title: s.title ?? seriesSlug,
      language: s.language ?? "en",
      author: s.author ?? "",
      authorSort: s.authorSort ?? "",
      illustrator: s.illustrator ?? "",
      illustratorSort: s.illustratorSort ?? "",
      publisher: s.publisher ?? "",
      date: s.date ?? "",
      subjects: s.subjects ?? [],
    });
    setSubjectsText((s.subjects ?? []).join(", "));
    setSaved(false);

  }, [seriesSlug]);

  function field(key: keyof EpubMetadata) {
    return {
      value: (form[key] as string) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  function handleSave() {
    const subjects = subjectsText.split(",").map((s) => s.trim()).filter(Boolean);
    const meta: EpubMetadata = { ...form, subjects };
    setSeriesMetadata(seriesSlug, meta);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-txt-dim">{t("heading")}</p>

      <Field label={t("title")}>
        <Input {...field("title")} />
      </Field>

      <Select
        label={t("language")}
        value={form.language ?? "en"}
        options={LANGUAGES}
        onChange={(v) => setForm((f) => ({ ...f, language: v }))}
      />

      <Field label={t("author")}>
        <Input
          {...field("author")}
          onBlur={() => { if (form.author && !form.authorSort) setForm((f) => ({ ...f, authorSort: autoSort(f.author ?? "") })); }}
        />
        <div className="mt-1.5 flex items-center gap-1.5">
          <Input {...field("authorSort")} placeholder={t("sortPlaceholder")} className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, authorSort: autoSort(f.author ?? "") }))}>
            {t("autoSort")}
          </Button>
        </div>
      </Field>

      <Field label={t("illustrator")}>
        <Input
          {...field("illustrator")}
          onBlur={() => { if (form.illustrator && !form.illustratorSort) setForm((f) => ({ ...f, illustratorSort: autoSort(f.illustrator ?? "") })); }}
        />
        <div className="mt-1.5 flex items-center gap-1.5">
          <Input {...field("illustratorSort")} placeholder={t("sortPlaceholder")} className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, illustratorSort: autoSort(f.illustrator ?? "") }))}>
            {t("autoSort")}
          </Button>
        </div>
      </Field>

      <div className="flex gap-2">
        <Field label={t("publisher")} className="flex-1">
          <Input {...field("publisher")} />
        </Field>
        <Field label={t("year")} className="w-24">
          <Input {...field("date")} placeholder="YYYY" maxLength={4} />
        </Field>
      </div>

      <Field label={t("subjects")}>
        <Input value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} placeholder={t("subjectsHint")} />
      </Field>

      <Button variant="pri" icon={saved ? "check" : undefined} onClick={handleSave} className="w-full">
        {saved ? t("saved") : t("save")}
      </Button>
    </div>
  );
}
