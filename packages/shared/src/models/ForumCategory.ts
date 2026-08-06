/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForumAuthor } from './ForumAuthor';
export type ForumCategory = {
    /**
     * Category id
     */
    id: number;
    /**
     * URL slug (unique)
     */
    slug: string;
    /**
     * Category name
     */
    name: string;
    /**
     * Category description
     */
    description: string;
    /**
     * Icon name
     */
    icon: string;
    /**
     * Display hue (0-360)
     */
    hue: number;
    /**
     * Whether the category is locked
     */
    locked: boolean;
    /**
     * Non-deleted thread count
     */
    threads: number;
    /**
     * Non-deleted post count
     */
    posts: number;
    /**
     * Author of the most recent activity in the category
     */
    lastAuthor?: ForumAuthor | null;
    /**
     * Timestamp of the most recent activity in the category
     */
    lastAt?: string | null;
};

