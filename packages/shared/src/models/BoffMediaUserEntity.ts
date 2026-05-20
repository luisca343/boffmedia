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
    uuid: string | null;
    /**
     * Profile picture URL
     */
    profilePicture: string | null;
    /**
     * Google ID for OAuth
     */
    googleId: string | null;
    /**
     * Discord ID for OAuth
     */
    discordId: string | null;
    /**
     * User creation timestamp
     */
    createdAt: string | null;
    /**
     * User last update timestamp
     */
    updatedAt: string | null;
};

