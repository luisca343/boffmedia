/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForumAuthor } from './ForumAuthor';
export type ForumThread = {
    /**
     * Thread id
     */
    id: number;
    /**
     * Category slug
     */
    catSlug: string;
    /**
     * Category name
     */
    catName: string;
    /**
     * Category display hue
     */
    catHue: number;
    /**
     * Thread title
     */
    title: string;
    /**
     * Thread author (OP)
     */
    author: ForumAuthor;
    /**
     * Author of the last post (null when there are no replies)
     */
    lastAuthor?: ForumAuthor | null;
    /**
     * Timestamp of the last post
     */
    lastAt?: string | null;
    /**
     * When the thread was created
     */
    createdAt: string;
    /**
     * Whether the thread is pinned
     */
    pinned: boolean;
    /**
     * Whether the thread is locked
     */
    locked: boolean;
    /**
     * Whether the thread is solved
     */
    solved: boolean;
    /**
     * Reply count (excludes the OP)
     */
    replies: number;
    /**
     * View count
     */
    views: number;
    /**
     * Vote count
     */
    votes: number;
};

