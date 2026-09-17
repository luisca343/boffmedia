/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangelogCtaEntity } from './ChangelogCtaEntity';
import type { ChangelogTranslationEntity } from './ChangelogTranslationEntity';
export type ChangelogItemEntity = {
    id: number;
    product: ChangelogItemEntity.product;
    platform: ChangelogItemEntity.platform;
    version: string | null;
    publishedAt: string;
    translation: ChangelogTranslationEntity;
    cta: ChangelogCtaEntity | null;
};
export namespace ChangelogItemEntity {
    export enum product {
        BOFFMEDIA = 'boffmedia',
        SMARTROTOM = 'smartrotom',
        ALL = 'all',
    }
    export enum platform {
        ALL = 'all',
        WEB = 'web',
        DESKTOP = 'desktop',
    }
}

