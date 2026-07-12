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
     * Public flag (0 = private, 1 = public)
     */
    public: number;
    /**
     * Pinned flag (0 = no, 1 = pinned)
     */
    pinned: number;
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

