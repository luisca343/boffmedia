/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChangelogAdminTranslationEntity = {
    id: number;
    locale: ChangelogAdminTranslationEntity.locale;
    title: string;
    summary: string | null;
    body: string;
    ctaLabel: string | null;
    status: ChangelogAdminTranslationEntity.status;
};
export namespace ChangelogAdminTranslationEntity {
    export enum locale {
        ES = 'es',
        EN = 'en',
    }
    export enum status {
        DRAFT = 'draft',
        TRANSLATED = 'translated',
        REVIEWED = 'reviewed',
    }
}

