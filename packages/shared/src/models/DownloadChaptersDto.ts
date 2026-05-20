/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChapterEntry } from './ChapterEntry';
export type DownloadChaptersDto = {
    /**
     * Series name used as the folder name on disk
     */
    seriesName: string;
    chapters: Array<ChapterEntry>;
    /**
     * Max concurrent chapter downloads (1-3, default 1)
     */
    concurrency?: number;
    /**
     * Manga detail page URL, used as Referer when fetching chapter pages
     */
    mangaUrl?: string;
};

