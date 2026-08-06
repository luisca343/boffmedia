/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LauncherVersionEntity } from './LauncherVersionEntity';
import type { PackServerEntity } from './PackServerEntity';
export type LauncherPackEntity = {
    id: string;
    slug: string;
    name: string;
    summary?: Record<string, any> | null;
    description?: Record<string, any> | null;
    iconUrl?: Record<string, any> | null;
    gallery?: Array<Record<string, any>> | null;
    accessKind: LauncherPackEntity.accessKind;
    gameType: LauncherPackEntity.gameType;
    server?: PackServerEntity | null;
    latestVersion?: LauncherVersionEntity | null;
};
export namespace LauncherPackEntity {
    export enum accessKind {
        PUBLIC = 'public',
        PASSWORD = 'password',
        ALLOWLIST = 'allowlist',
    }
    export enum gameType {
        MINECRAFT = 'minecraft',
        EMULATOR = 'emulator',
    }
}

