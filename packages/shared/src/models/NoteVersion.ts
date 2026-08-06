/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NoteVersion = {
    /**
     * Version ID
     */
    id: number;
    /**
     * Document ID this version belongs to
     */
    documentId: number;
    /**
     * Optional human label for the snapshot
     */
    label: string | null;
    /**
     * Full HTML content snapshot
     */
    content: string;
    /**
     * UUID of the author who produced this snapshot
     */
    authorUuid: string | null;
    /**
     * Word count at snapshot time
     */
    words: number;
    createdAt: string;
};

