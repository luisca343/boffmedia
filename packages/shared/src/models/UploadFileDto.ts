/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UploadFileDto = {
    /**
     * File to upload
     */
    file: Blob;
    /**
     * Subdirectory path within uploads folder
     */
    path?: string;
    /**
     * Custom filename (with extension)
     */
    filename?: string;
};

