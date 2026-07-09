/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EpubMetadataDto } from './EpubMetadataDto';
export type ConvertChapterDto = {
    series: string;
    chapter: string;
    excludePages?: Array<number>;
    includeCover?: boolean;
    metadata?: EpubMetadataDto;
};

