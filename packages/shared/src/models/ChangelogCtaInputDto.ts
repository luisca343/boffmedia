/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChangelogCtaInputDto = {
    product: ChangelogCtaInputDto.product;
    platform: ChangelogCtaInputDto.platform;
    url: string;
};
export namespace ChangelogCtaInputDto {
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

