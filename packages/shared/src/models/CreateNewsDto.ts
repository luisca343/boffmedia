/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateNewsDto = {
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
     * Whether the article is published
     */
    published?: boolean;
    /**
     * Whether the article is featured
     */
    featured?: boolean;
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

