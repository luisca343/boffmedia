/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { News } from './News';
export type NewsResponse = {
    /**
     * Featured news item
     */
    featured: News | null;
    /**
     * List of news items
     */
    news: Array<News>;
};

