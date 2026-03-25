/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateEventDto = {
    /**
     * The ID of the parent event, if any
     */
    parentId?: number;
    /**
     * The title of the event
     */
    title: string;
    /**
     * The description of the event
     */
    description: string;
    /**
     * The game ID
     */
    gameId: number;
    /**
     * The start date of the event
     */
    startDate: string;
    /**
     * The end date of the event
     */
    endDate?: string;
    /**
     * The visibility of the event
     */
    visibility: CreateEventDto.visibility;
    /**
     * The type of event
     */
    type: CreateEventDto.type;
    /**
     * The icon of the event
     */
    icon: string;
    /**
     * The banner of the event
     */
    banner?: string;
};
export namespace CreateEventDto {
    /**
     * The visibility of the event
     */
    export enum visibility {
        PUBLIC = 'public',
        PRIVATE = 'private',
    }
    /**
     * The type of event
     */
    export enum type {
        EVENT = 'event',
        SERVER = 'server',
    }
}

