/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CurseforgeSourceDto } from './CurseforgeSourceDto';
import type { ModrinthSourceDto } from './ModrinthSourceDto';
import type { UrlSourceDto } from './UrlSourceDto';
export type ResolveFileDto = {
    /**
     * FileSource de @boffmedia/pack-schema — {kind:"curseforge"|"modrinth"|"url", …}
     */
    source: (CurseforgeSourceDto | ModrinthSourceDto | UrlSourceDto);
};

