import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChapterPageInfo, EpubMetadata, LocalMangaLibrary } from "@/services/api/boffmedia/scrapeService";

export type { EpubMetadata };

export type MangaStore = {
  library: LocalMangaLibrary | null;
  setLibrary: (lib: LocalMangaLibrary) => void;
  clearLibraryCache: () => void;

  chapterPages: Record<string, ChapterPageInfo[]>;
  setChapterPages: (chapterId: string, pages: ChapterPageInfo[]) => void;

  currentMangaId: string | null;
  currentChapterId: string | null;
  pageSelections: Record<string, number[]>;

  seriesMetadata: Record<string, EpubMetadata>;
  setSeriesMetadata: (slug: string, meta: EpubMetadata) => void;

  setCurrentManga: (id: string) => void;
  setCurrentChapter: (id: string) => void;
  togglePage: (chapterId: string, page: number) => void;
  setPages: (chapterId: string, pages: number[]) => void;
  resetSelections: () => void;
};

export const useMangaStore = create<MangaStore>()(
  persist(
    (set, get) => ({
      library: null,
      setLibrary: (lib) => set({ library: lib }),
      clearLibraryCache: () => set({ library: null, chapterPages: {} }),

      chapterPages: {},
      setChapterPages: (chapterId, pages) =>
        set({ chapterPages: { ...get().chapterPages, [chapterId]: pages } }),

      currentMangaId: null,
      currentChapterId: null,
      pageSelections: {},

      seriesMetadata: {},
      setSeriesMetadata: (slug, meta) =>
        set({ seriesMetadata: { ...get().seriesMetadata, [slug]: meta } }),

      setCurrentManga: (id) => set({ currentMangaId: id }),
      setCurrentChapter: (id) => set({ currentChapterId: id }),
      togglePage: (chapterId, page) => {
        const prev = get().pageSelections[chapterId] ?? [];
        set({
          pageSelections: {
            ...get().pageSelections,
            [chapterId]: prev.includes(page)
              ? prev.filter((p) => p !== page)
              : [...prev, page],
          },
        });
      },
      setPages: (chapterId, pages) =>
        set({ pageSelections: { ...get().pageSelections, [chapterId]: pages } }),
      resetSelections: () => set({ pageSelections: {} }),
    }),
    {
      name: "manga-store",
      partialize: (state) => ({
        currentMangaId: state.currentMangaId,
        currentChapterId: state.currentChapterId,
        pageSelections: state.pageSelections,
        library: state.library,
        chapterPages: state.chapterPages,
        seriesMetadata: state.seriesMetadata,
      }),
    }
  )
);
