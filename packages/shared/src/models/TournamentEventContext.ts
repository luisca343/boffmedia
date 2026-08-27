/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TournamentEventContext = {
    id: number;
    title: string;
    visibility: TournamentEventContext.visibility;
    status: TournamentEventContext.status;
    /**
     * True when the viewer holds an active membership. False means registration will be refused until they join the event.
     */
    viewerIsMember: boolean;
};
export namespace TournamentEventContext {
    export enum visibility {
        PUBLIC = 'public',
        PRIVATE = 'private',
    }
    export enum status {
        UPCOMING = 'upcoming',
        ACTIVE = 'active',
        COMPLETED = 'completed',
    }
}

