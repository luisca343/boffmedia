"use client";

import { useTranslations } from "next-intl";
import { EyeOff } from "lucide-react";
import { ChapterPageInfo, ScrapeService } from "@/services/api/boffmedia/scrapeService";

interface Props {
  series: string;
  chapter: string;
  pages: ChapterPageInfo[];
  discarded: Set<number>;
  onToggle: (index: number) => void;
}

export default function ChapterGrid({ series, chapter, pages, discarded, onToggle }: Props) {
  const t = useTranslations("boffmedia.mangaLibrary");

  return (
    <div className="space-y-3">
      <p className="text-sm text-surface-400">{t("discardHint")}</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {pages.map((page) => {
          const isDiscarded = discarded.has(page.index);
          return (
            <button
              key={page.index}
              type="button"
              onClick={() => onToggle(page.index)}
              className="relative aspect-[2/3] overflow-hidden rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              aria-label={`Page ${page.index + 1}${isDiscarded ? " (discarded)" : ""}`}
              aria-pressed={isDiscarded}
            >
              { }
              <img
                src={ScrapeService.getChapterImageUrl(series, chapter, page.index)}
                alt={`Page ${page.index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 leading-none">
                {page.index + 1}
              </span>
              {isDiscarded && (
                <div className="absolute inset-0 bg-red-700/70 flex items-center justify-center">
                  <EyeOff className="text-white w-5 h-5" />
                </div>
              )}
              {!isDiscarded && (
                <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
