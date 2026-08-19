/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AddNoteToUserDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Document ID
     */
    documentId: number;
    /**
     * UUID of the player the note is shared with (NOT the caller)
     */
    uuid: string;
};

