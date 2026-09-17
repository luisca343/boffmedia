/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangelogCtaInputDto } from './ChangelogCtaInputDto';
import type { ChangelogTranslationInputDto } from './ChangelogTranslationInputDto';
export type UpdateChangelogDto = {
    product?: UpdateChangelogDto.product;
    platform?: UpdateChangelogDto.platform;
    version?: string;
    translations?: Array<ChangelogTranslationInputDto>;
    ctas?: Array<ChangelogCtaInputDto>;
};
export namespace UpdateChangelogDto {
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

