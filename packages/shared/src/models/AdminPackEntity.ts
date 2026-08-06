/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackServerEntity } from './PackServerEntity';
export type AdminPackEntity = {
    id: string;
    slug: string;
    name: string;
    summary?: Record<string, any> | null;
    iconUrl?: Record<string, any> | null;
    accessKind: string;
    gameType: AdminPackEntity.gameType;
    server?: PackServerEntity | null;
    archived: boolean;
    hasPassword: boolean;
    aclCount: number;
    versionCount: number;
    latestVersionId?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
};
export namespace AdminPackEntity {
    export enum gameType {
        MINECRAFT = 'minecraft',
        EMULATOR = 'emulator',
    }
}

