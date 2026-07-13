/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateNewsDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * News ID. Ignored on create — the database assigns it, and the update route takes it from the URL. Optional so a client never has to invent one.
     */
    id?: number;
    /**
     * News title
     */
    title: string;
    /**
     * News subtitle
     */
    subtitle?: string;
    /**
     * News category
     */
    category?: string;
    /**
     * News subcategory
     */
    subcategory?: string;
    /**
     * Published status (0=draft, 1=published)
     */
    published?: number;
    /**
     * Featured status (0=normal, 1=featured)
     */
    featured?: number;
    /**
     * News content
     */
    content: string;
    /**
     * Button text for call-to-action
     */
    buttonText?: string;
    /**
     * Image URL for the news
     */
    imageUrl?: string;
    /**
     * Byline author name
     */
    author?: string;
    /**
     * Author masthead role
     */
    authorRole?: string;
    /**
     * Magazine issue number
     */
    issue?: number;
};

