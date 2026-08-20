/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DesktopVersionEntity } from './DesktopVersionEntity';
import type { PackServerEntity } from './PackServerEntity';
export type LauncherPackEntity = {
    id: string;
    slug: string;
    name: string;
    /**
     * Resuelto: NULL en BD → minecraft
     */
    gameType: LauncherPackEntity.gameType;
    summary?: Record<string, any> | null;
    description?: Record<string, any> | null;
    iconUrl?: Record<string, any> | null;
    gallery?: Array<Record<string, any>> | null;
    accessKind: LauncherPackEntity.accessKind;
    server?: PackServerEntity | null;
    latestVersion?: DesktopVersionEntity | null;
};
export namespace LauncherPackEntity {
    /**
     * Resuelto: NULL en BD → minecraft
     */
    export enum gameType {
        MINECRAFT = 'minecraft',
        EMULATOR = 'emulator',
        ZOMBOID = 'zomboid',
        STARDEW = 'stardew',
    }
    export enum accessKind {
        PUBLIC = 'public',
        PASSWORD = 'password',
        ALLOWLIST = 'allowlist',
    }
}

