/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChangelogTranslationEntity = {
    id: number;
    locale: ChangelogTranslationEntity.locale;
    title: string;
    summary: string | null;
    body: string;
    ctaLabel: string | null;
};
export namespace ChangelogTranslationEntity {
    export enum locale {
        ES = 'es',
        EN = 'en',
    }
}

