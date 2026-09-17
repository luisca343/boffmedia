/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangelogAdminTranslationEntity } from './ChangelogAdminTranslationEntity';
import type { ChangelogCtaEntity } from './ChangelogCtaEntity';
export type ChangelogAdminItemEntity = {
    id: number;
    product: ChangelogAdminItemEntity.product;
    platform: ChangelogAdminItemEntity.platform;
    version: string | null;
    status: ChangelogAdminItemEntity.status;
    publishedAt: string | null;
    translations: Array<ChangelogAdminTranslationEntity>;
    ctas: Array<ChangelogCtaEntity>;
    updatedAt: string;
};
export namespace ChangelogAdminItemEntity {
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
    export enum status {
        DRAFT = 'draft',
        PUBLISHED = 'published',
        UNPUBLISHED = 'unpublished',
    }
}

