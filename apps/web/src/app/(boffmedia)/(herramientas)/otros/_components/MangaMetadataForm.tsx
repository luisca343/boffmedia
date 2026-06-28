"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
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
  const t = useTranslations("boffmedia.mangaLibrary");
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

  // Re-sync when switching series
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
    const subjects = subjectsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const meta: EpubMetadata = { ...form, subjects };
    setSeriesMetadata(seriesSlug, meta);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputCls = "h-8 text-sm bg-layer-2/60 border-edge text-ink placeholder-ink-dim";

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{t("metadata")}</p>

      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs text-ink-muted">{t("metaTitle")}</label>
        <Input {...field("title")} className={inputCls} />
      </div>

      {/* Language */}
      <div className="space-y-1">
        <label className="text-xs text-ink-muted">{t("metaLanguage")}</label>
        <select
          value={form.language ?? "en"}
          onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
          className="w-full h-8 rounded-md border border-edge bg-layer-2/60 text-ink text-sm px-2 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Author */}
      <div className="space-y-1">
        <label className="text-xs text-ink-muted">{t("metaAuthor")}</label>
        <Input
          {...field("author")}
          className={inputCls}
          onBlur={() => {
            if (form.author && !form.authorSort) {
              setForm((f) => ({ ...f, authorSort: autoSort(f.author ?? "") }));
            }
          }}
        />
        <div className="flex gap-1.5 items-center">
          <Input
            {...field("authorSort")}
            placeholder={t("metaSortPlaceholder")}
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, authorSort: autoSort(f.author ?? "") }))}
            className="text-[11px] text-primary-hover hover:text-primary-hover transition-colors px-1.5 py-1 rounded border border-primary-active/50 bg-primary-soft/20 shrink-0"
          >
            {t("autoSort")}
          </button>
        </div>
      </div>

      {/* Illustrator */}
      <div className="space-y-1">
        <label className="text-xs text-ink-muted">{t("metaIllustrator")}</label>
        <Input
          {...field("illustrator")}
          className={inputCls}
          onBlur={() => {
            if (form.illustrator && !form.illustratorSort) {
              setForm((f) => ({ ...f, illustratorSort: autoSort(f.illustrator ?? "") }));
            }
          }}
        />
        <div className="flex gap-1.5 items-center">
          <Input
            {...field("illustratorSort")}
            placeholder={t("metaSortPlaceholder")}
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, illustratorSort: autoSort(f.illustrator ?? "") }))}
            className="text-[11px] text-primary-hover hover:text-primary-hover transition-colors px-1.5 py-1 rounded border border-primary-active/50 bg-primary-soft/20 shrink-0"
          >
            {t("autoSort")}
          </button>
        </div>
      </div>

      {/* Publisher + Year side by side */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-ink-muted">{t("metaPublisher")}</label>
          <Input {...field("publisher")} className={inputCls} />
        </div>
        <div className="w-20 space-y-1">
          <label className="text-xs text-ink-muted">{t("metaYear")}</label>
          <Input {...field("date")} placeholder="YYYY" className={inputCls} maxLength={4} />
        </div>
      </div>

      {/* Subjects */}
      <div className="space-y-1">
        <label className="text-xs text-ink-muted">{t("metaSubjects")}</label>
        <Input
          value={subjectsText}
          onChange={(e) => setSubjectsText(e.target.value)}
          placeholder={t("metaSubjectsHint")}
          className={inputCls}
        />
      </div>

      {/* Save */}
      <Button size="sm" onClick={handleSave} className="w-full">
        {saved ? (
          <><Check className="w-3.5 h-3.5 mr-1.5" />{t("metaSaved")}</>
        ) : (
          t("saveMetadata")
        )}
      </Button>
    </div>
  );
}
