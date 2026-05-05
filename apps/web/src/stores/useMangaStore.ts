import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChapterPageInfo, LocalMangaLibrary } from "@/services/api/boffmedia/scrapeService";

export type MangaStore = {
  library: LocalMangaLibrary | null;
  setLibrary: (lib: LocalMangaLibrary) => void;

  chapterPages: Record<string, ChapterPageInfo[]>;
  setChapterPages: (chapterId: string, pages: ChapterPageInfo[]) => void;

  currentMangaId: string | null;
  currentChapterId: string | null;
  pageSelections: Record<string, number[]>;

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

      chapterPages: {},
      setChapterPages: (chapterId, pages) =>
        set({ chapterPages: { ...get().chapterPages, [chapterId]: pages } }),

      currentMangaId: null,
      currentChapterId: null,
      pageSelections: {},

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
      }),
    }
  )
);
