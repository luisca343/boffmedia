/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BoffMediaUserEntity = {
    /**
     * Unique identifier for the user
     */
    id: number;
    /**
     * User email address
     */
    email: string;
    /**
     * Username
     */
    username: string;
    /**
     * User UUID
     */
    uuid: Record<string, any> | null;
    /**
     * Profile picture URL
     */
    profilePicture: Record<string, any> | null;
    /**
     * Google ID for OAuth
     */
    googleId: Record<string, any> | null;
    /**
     * Discord ID for OAuth
     */
    discordId: Record<string, any> | null;
    /**
     * User creation timestamp
     */
    createdAt: Record<string, any> | null;
    /**
     * User last update timestamp
     */
    updatedAt: Record<string, any> | null;
};

