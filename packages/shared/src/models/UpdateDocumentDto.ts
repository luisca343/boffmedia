/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateDocumentDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Document title
     */
    title?: string;
    /**
     * Document content
     */
    content?: string;
    /**
     * Document type
     */
    type?: number;
    /**
     * Whether the document is public
     */
    public?: number;
    /**
     * Whether the document is pinned (0 = no, 1 = pinned)
     */
    pinned?: number;
    /**
     * Folder the document belongs to; null moves it to the root
     */
    folderId?: number | null;
};

