/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChangelogCtaEntity = {
    id: number;
    product: ChangelogCtaEntity.product;
    platform: ChangelogCtaEntity.platform;
    url: string;
};
export namespace ChangelogCtaEntity {
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

