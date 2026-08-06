/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForumAuthor } from './ForumAuthor';
export type ForumPost = {
    /**
     * Post id
     */
    id: number;
    /**
     * Thread id this post belongs to
     */
    threadId: number;
    /**
     * Post author
     */
    author: ForumAuthor;
    /**
     * Post body (markdown)
     */
    body: string;
    /**
     * Whether this post is the accepted solution
     */
    isSolution: boolean;
    /**
     * Whether this post is the original post (earliest in the thread)
     */
    isOp: boolean;
    /**
     * When the post was created
     */
    createdAt: string;
    /**
     * When the post was last updated
     */
    updatedAt: string;
};

