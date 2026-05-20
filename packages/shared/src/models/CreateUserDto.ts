/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateUserDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * User email address
     */
    email: string;
    /**
     * Username for the user
     */
    username: string;
    /**
     * User password
     */
    password: string;
    /**
     * User UUID
     */
    uuid?: string;
    /**
     * Profile picture URL
     */
    profilePicture?: string;
    /**
     * Google ID for OAuth
     */
    googleId?: string;
    /**
     * Discord ID for OAuth
     */
    discordId?: string;
};

