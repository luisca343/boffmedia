/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSanctionDto = {
    contentType: CreateSanctionDto.contentType;
    contentId: string;
    kind: CreateSanctionDto.kind;
    reason: string;
    days?: number;
};
export namespace CreateSanctionDto {
    export enum contentType {
        FORUM_THREAD = 'forum_thread',
        FORUM_POST = 'forum_post',
        ROOKER_POST = 'rooker_post',
        USER_PROFILE = 'user_profile',
    }
    export enum kind {
        WARNING = 'warning',
        CONTENT_BAN = 'content_ban',
    }
}

