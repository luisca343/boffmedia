/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NoteFolder = {
    /**
     * Folder ID
     */
    id: number;
    /**
     * Folder name
     */
    name: string;
    /**
     * Semantic palette key (primary | secondary | accent | success | warning | error | info)
     */
    color: string;
    /**
     * Parent folder ID for nesting, or null for a root folder
     */
    parentId: number | null;
    createdAt: string;
    updatedAt: string;
};

