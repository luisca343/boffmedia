/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DownloadMangaNovelDto = {
    /**
     * Novel page URL
     */
    url: string;
    /**
     * First chapter to download (1-based, inclusive)
     */
    from?: number;
    /**
     * Last chapter to download (1-based, inclusive)
     */
    to?: number;
    /**
     * Skip chapters that already exist on disk as .cbz files (default: true)
     */
    skipDownloaded?: boolean;
};

