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
     * Cover (banner) image URL
     */
    coverImage: string | null;
    /**
     * Short user biography
     */
    bio: string | null;
    /**
     * Google ID for OAuth
     */
    googleId: string | null;
    /**
     * Discord ID for OAuth
     */
    discordId: string | null;
    /**
     * Whether the user has verified their email address
     */
    emailVerified: boolean;
    /**
     * User creation timestamp
     */
    createdAt: string | null;
    /**
     * User last update timestamp
     */
    updatedAt: string | null;
};

