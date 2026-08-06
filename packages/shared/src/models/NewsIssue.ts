/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NewsIssue = {
    /**
     * Magazine issue number
     */
    issue: number;
    /**
     * Number of articles in this issue
     */
    articles: number;
    /**
     * Headline article title for this issue (featured article, or newest if none is featured)
     */
    headline: string;
    /**
     * Publication date of the issue (most recent article)
     */
    publishedAt: string;
};

