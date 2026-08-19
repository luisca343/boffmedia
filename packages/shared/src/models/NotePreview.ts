/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NotePreview = {
    /**
     * Note ID
     */
    id: number;
    /**
     * Note title
     */
    title: string;
    /**
     * Note type
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
     * Folder ID the note belongs to, or null
     */
    folderId: number | null;
    /**
     * IDs of tags applied to the note
     */
    tags: Array<number>;
    /**
     * UUIDs of users this note is shared with
     */
    sharedWith: Array<string>;
    /**
     * Soft-delete timestamp; null means live
     */
    deletedAt: string | null;
    /**
     * Note creation date
     */
    createdAt: string;
    /**
     * Note last update date
     */
    updatedAt: string;
};

