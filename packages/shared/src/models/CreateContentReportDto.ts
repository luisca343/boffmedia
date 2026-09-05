/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateContentReportDto = {
    contentType: CreateContentReportDto.contentType;
    /**
     * The item id, as a string.
     */
    contentId: string;
    reason: CreateContentReportDto.reason;
    detail?: string;
};
export namespace CreateContentReportDto {
    export enum contentType {
        FORUM_THREAD = 'forum_thread',
        FORUM_POST = 'forum_post',
        ROOKER_POST = 'rooker_post',
        USER_PROFILE = 'user_profile',
    }
    export enum reason {
        SPAM = 'spam',
        HARASSMENT = 'harassment',
        HATE = 'hate',
        SEXUAL = 'sexual',
        ILLEGAL = 'illegal',
        OFF_TOPIC = 'off_topic',
        OTHER = 'other',
    }
}

