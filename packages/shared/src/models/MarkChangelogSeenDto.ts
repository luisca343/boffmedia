/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MarkChangelogSeenDto = {
    entryId: number;
    product: MarkChangelogSeenDto.product;
    platform: MarkChangelogSeenDto.platform;
};
export namespace MarkChangelogSeenDto {
    export enum product {
        BOFFMEDIA = 'boffmedia',
        SMARTROTOM = 'smartrotom',
    }
    export enum platform {
        ALL = 'all',
        WEB = 'web',
        DESKTOP = 'desktop',
    }
}

