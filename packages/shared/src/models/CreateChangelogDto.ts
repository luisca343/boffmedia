/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangelogCtaInputDto } from './ChangelogCtaInputDto';
import type { ChangelogTranslationInputDto } from './ChangelogTranslationInputDto';
export type CreateChangelogDto = {
    product: CreateChangelogDto.product;
    platform: CreateChangelogDto.platform;
    version?: string;
    translations: Array<ChangelogTranslationInputDto>;
    ctas?: Array<ChangelogCtaInputDto>;
};
export namespace CreateChangelogDto {
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

