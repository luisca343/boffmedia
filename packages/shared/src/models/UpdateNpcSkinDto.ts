/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateNpcSkinDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * NPC identifiers wearing this skin
     */
    npcs?: Array<string>;
    src?: number;
    face?: number;
    head?: number;
    body?: number;
    /**
     * Officer performing the action, for the audit log
     */
    actorUuid?: string;
};

