/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Document = {
    /**
     * Document ID
     */
    id: number;
    /**
     * Document title
     */
    title: string;
    /**
     * Document content
     */
    content: string;
    /**
     * Document type
     */
    type: number;
    /**
     * Whether the note is publicly readable
     */
    public: boolean;
    /**
     * Whether the note is pinned
     */
    pinned: boolean;
    /**
     * Folder ID the document belongs to, or null
     */
    folderId: number | null;
    /**
     * Soft-delete timestamp; null means live
     */
    deletedAt: string | null;
    /**
     * Document creation date
     */
    createdAt: string;
    /**
     * Document last update date
     */
    updatedAt: string;
};

