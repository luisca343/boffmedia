/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChangelogTranslationInputDto = {
    locale: ChangelogTranslationInputDto.locale;
    title: string;
    summary?: string;
    body: string;
    ctaLabel?: string;
    status?: ChangelogTranslationInputDto.status;
};
export namespace ChangelogTranslationInputDto {
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

