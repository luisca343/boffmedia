/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForumThread } from './ForumThread';
export type ForumThreadList = {
    /**
     * Threads on this page
     */
    items: Array<ForumThread>;
    /**
     * Total matching threads
     */
    total: number;
    /**
     * Current page (1-based)
     */
    page: number;
    /**
     * Page size
     */
    pageSize: number;
};

