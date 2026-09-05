/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AuthorSummaryEntity = {
    userId?: Record<string, any>;
    uuid?: Record<string, any>;
    username?: Record<string, any>;
    /**
     * Open reports against this author.
     */
    openReports: number;
    /**
     * Reports against this author that ended in an action.
     */
    actionedReports: number;
    /**
     * Reports against this author, ever.
     */
    totalReports: number;
    /**
     * Sanctions on record.
     */
    sanctions: number;
    contentBanned: boolean;
};

