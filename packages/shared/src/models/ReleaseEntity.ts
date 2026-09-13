/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReleaseEntryEntity } from './ReleaseEntryEntity';
export type ReleaseEntity = {
    id: number;
    version: string;
    requiredSurfaces: Array<'web' | 'api' | 'desktop'>;
    status: ReleaseEntity.status;
    creationSource: ReleaseEntity.creationSource;
    changelogMode: ReleaseEntity.changelogMode;
    approved: boolean;
    published: boolean;
    withdrawn: boolean;
    withdrawalReason?: string | null;
    /**
     * Whether the authenticated user has seen this release
     */
    seen?: boolean;
    entries: Array<ReleaseEntryEntity>;
    publishedAt?: string | null;
    sourceCommitSha?: string | null;
    versionFileSha?: string | null;
    createdAt: string;
};
export namespace ReleaseEntity {
    export enum status {
        DRAFT = 'draft',
        PUBLISHED = 'published',
        ARCHIVED = 'archived',
    }
    export enum creationSource {
        FRAGMENTS = 'fragments',
        MANUAL = 'manual',
        MIGRATION = 'migration',
    }
    export enum changelogMode {
        ENTRIES = 'entries',
        NONE = 'none',
    }
}

