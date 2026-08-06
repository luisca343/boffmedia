/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForumPost } from './ForumPost';
export type ForumPostList = {
    /**
     * Posts on this page
     */
    items: Array<ForumPost>;
    /**
     * Total posts in the thread
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

