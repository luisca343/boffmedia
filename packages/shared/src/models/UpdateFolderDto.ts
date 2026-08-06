/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateFolderDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Folder name
     */
    name?: string;
    /**
     * Semantic palette key
     */
    color?: string;
    /**
     * Parent folder ID for nesting
     */
    parentId?: number | null;
};

