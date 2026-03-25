/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type News = {
    /**
     * News ID
     */
    id: number;
    /**
     * News title
     */
    title: string;
    /**
     * News subtitle
     */
    subtitle: string;
    /**
     * News category
     */
    category: string;
    /**
     * News subcategory
     */
    subcategory: string;
    /**
     * Published status (0=draft, 1=published)
     */
    published: number;
    /**
     * Featured status (0=normal, 1=featured)
     */
    featured: number;
    /**
     * News content
     */
    content: string;
    /**
     * Button text for call-to-action
     */
    buttonText: string;
    /**
     * Image URL for the news
     */
    imageUrl: string;
    /**
     * News creation date
     */
    createdAt: string;
    /**
     * News last update date
     */
    updatedAt: string;
};

