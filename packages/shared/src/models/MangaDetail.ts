/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MangaChapter } from './MangaChapter';
export type MangaDetail = {
    title: string;
    url: string;
    source: string;
    coverUrl?: string;
    tags: Array<string>;
    chapters: Array<MangaChapter>;
    chapterCount: number;
};

