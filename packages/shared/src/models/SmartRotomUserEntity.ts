/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SmartRotomUserEntity = {
    /**
     * SmartRotom user ID
     */
    id: number;
    /**
     * SmartRotom user UUID
     */
    uuid: string;
    /**
     * SmartRotom username
     */
    username: string;
    /**
     * Current Minecraft world
     */
    world: Record<string, any> | null;
    /**
     * User energy level
     */
    energy: Record<string, any> | null;
    /**
     * Last energy charge timestamp
     */
    lastCharge: Record<string, any> | null;
};

