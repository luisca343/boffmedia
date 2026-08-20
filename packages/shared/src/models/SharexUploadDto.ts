/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SharexUploadDto = {
    /**
     * The uploader's ShareX token, issued by an admin via POST /sharex/tokens. Named `key` because that is the field name existing ShareX uploader configs already send. It authenticates the request AND identifies who uploaded — the image row stores the token it came from.
     */
    key: string;
};

