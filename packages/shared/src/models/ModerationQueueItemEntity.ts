/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorSummaryEntity } from './AuthorSummaryEntity';
export type ModerationQueueItemEntity = {
    contentType: string;
    contentId: string;
    reportCount: number;
    reasons: Array<string>;
    firstReportedAt: string;
    lastReportedAt: string;
    excerpt?: Record<string, any>;
    /**
     * True when the item is gone from the surface it lives on.
     */
    hidden: boolean;
    /**
     * False when the content no longer exists at all.
     */
    contentExists: boolean;
    contentCreatedAt?: Record<string, any>;
    author: AuthorSummaryEntity;
};

