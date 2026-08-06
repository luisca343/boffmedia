/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RookerPostAuthorEntity } from './RookerPostAuthorEntity';
import type { RookerPostBattleEntity } from './RookerPostBattleEntity';
import type { RookerPostCaptureEntity } from './RookerPostCaptureEntity';
import type { RookerPostCountsEntity } from './RookerPostCountsEntity';
import type { RookerPostViewerStateEntity } from './RookerPostViewerStateEntity';
export type RookerPostEntity = {
    id: number;
    author: RookerPostAuthorEntity;
    text?: Record<string, any> | null;
    type: RookerPostEntity.type;
    createdAt?: Record<string, any> | null;
    pinned: boolean;
    parentId?: Record<string, any> | null;
    counts: RookerPostCountsEntity;
    /**
     * Always present. Defaults (reaction:null, retrino:false, bookmark:false) when no viewer uuid was passed.
     */
    me: RookerPostViewerStateEntity;
    capture?: RookerPostCaptureEntity | null;
    battle?: RookerPostBattleEntity | null;
    mediaUrl?: Record<string, any> | null;
    /**
     * Handle of the followee whose retrino surfaced this post in the "siguiendo" feed; null otherwise.
     */
    retrinoBy?: Record<string, any> | null;
};
export namespace RookerPostEntity {
    export enum type {
        TEXT = 'text',
        MEDIA = 'media',
        CAPTURE = 'capture',
        BATTLE = 'battle',
    }
}

